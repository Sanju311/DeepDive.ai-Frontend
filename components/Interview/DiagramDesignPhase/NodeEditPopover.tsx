"use client"

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Node} from "./types"

export function NodeEditPopover({
  node,
  onClose,
  onSave,
  onDelete,
}: {
  node: Node | null
  onClose: () => void
  onSave: (n: Node) => void
  onDelete?: (id: string) => void
}) {
  const [form, setForm] = useState<Node | null>(node)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setForm(node), [node])

  // Position the popover within the React Flow canvas, flipping when near edges
  // Uses rAF retries to wait until the node DOM actually mounts (prevents 0,0 flash)
  useEffect(() => {
    if (!node) return

    let cancelled = false
    let attempts = 0
    const MAX_ATTEMPTS = 6

    const measureAndSet = () => {
      if (cancelled) return
      const nodeEl = document.querySelector(
        `.react-flow__node[data-id="${node.id}"]`
      ) as HTMLElement | null
      const canvasEl = document.querySelector('.react-flow') as HTMLElement | null
      if (!nodeEl || !canvasEl) {
        if (attempts++ < MAX_ATTEMPTS) requestAnimationFrame(measureAndSet)
        return
      }

      const nodeRect = nodeEl.getBoundingClientRect()
      const canvasRect = canvasEl.getBoundingClientRect()

      const OFFSET = 8
      const POPOVER_WIDTH = 256 // Tailwind w-64
      const popoverHeight = contentRef.current?.offsetHeight || 200

      // Convert canvas bounds to page coordinates
      const canvasTop = canvasRect.top + window.scrollY
      const canvasLeft = canvasRect.left + window.scrollX
      const canvasRight = canvasLeft + canvasRect.width
      const canvasBottom = canvasTop + canvasRect.height

      // Default: below and centered
      let top = nodeRect.bottom + OFFSET + window.scrollY
      let left = nodeRect.left + nodeRect.width / 2 - POPOVER_WIDTH / 2 + window.scrollX

      // Flip vertically if overflowing bottom
      if (top + popoverHeight > canvasBottom) {
        top = nodeRect.top + window.scrollY - OFFSET - popoverHeight
      }

      // Clamp horizontally within canvas
      if (left < canvasLeft) left = canvasLeft + OFFSET
      if (left + POPOVER_WIDTH > canvasRight) left = canvasRight - POPOVER_WIDTH - OFFSET

      // If still above canvas, push inside
      if (top < canvasTop) top = canvasTop + OFFSET

      setCoords({ top, left })
    }

    const raf = requestAnimationFrame(measureAndSet)
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [node])

  if (!form) return null

  const handleChange = (field: keyof Node['data'], value: any) => {
    setForm(prev => (prev ? { ...prev, data: { ...prev.data, [field]: value } } : prev))
  }

  const handleValueChange = (key: string, value: any) => {
    setForm(prev => (
      prev ? { ...prev, data: { ...prev.data, values: { ...(prev.data.values || {}), [key]: value } } } : prev
    ))
  }

  const handleClose = () => {
    if (form) onSave(form)
    onClose()
  }

  const deleteNode = () => {
    if (!form?.id) return
    onDelete?.(form.id)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleClose()
    }
  }

  return (
    <Popover open={!!node} onOpenChange={(open) => !open && handleClose()}>
      {coords && (
      <PopoverContent
        ref={contentRef}
        side="right"
        align="center"
        className="w-64 p-3 space-y-2 border shadow-md rounded-lg bg-background"
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed",
          left: coords?.left ?? 0,
          top: coords?.top ?? 0,
        }}
      >
        <div>
          <Label className="text-xs text-muted-foreground">Optional Display Label</Label>
          <Input
            className="h-7 text-sm"
            value={form.data.label}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="ex: Hashing Service"
            autoFocus
            maxLength={15}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <textarea
                className="w-full text-sm rounded-md border bg-background pl-2 pr-1 py-2 resize-y max-h-64 min-h-[4rem] overflow-y-auto dark-scroll"
                value={form?.data?.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                placeholder="Briefly describe the node..."
              />
        </div>

        {/* Dynamic fields based on schema */}
        {form.data.schema && (
          <div className="space-y-3">
            {Object.entries(form.data.schema).map(([key, def]: any) => {
              const value = form.data.values?.[key]
              const label = key.charAt(0).toUpperCase() + key.slice(1)

              // Array -> select of options
              if (Array.isArray(def)) {
                return (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Select value={value} onValueChange={(v) => handleValueChange(key, v)}>
                      <SelectTrigger className="h-7 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {def.map((opt: string) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              }

              // Primitive type -> input/select
              if (def === "number") {
                return (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      type="number"
                      className="h-7 text-sm"
                      value={value ?? 0}
                      onChange={(e) => handleValueChange(key, Number(e.target.value))}
                    />
                  </div>
                )
              }

              if (def === "boolean") {
                return (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Select value={String(value)} onValueChange={(v) => handleValueChange(key, v === "true") }>
                      <SelectTrigger className="h-7 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )
              }

              // default string input (use textarea for 'description' style keys)
              return (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  {key.toLowerCase() === "description" ? (
                      <textarea
                      className="w-full text-sm rounded-md border bg-background pl-2 pr-1 py-2 resize-y max-h-64 min-h-[4rem] overflow-y-auto dark-scroll"
                      value={form?.data?.description ?? ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={3}
                      placeholder="Briefly describe the connection..."
                    />
                  ) : (
                    <Input
                      className="h-7 text-sm"
                      value={value ?? ""}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                    />
                  )}
                </div>
              )
            })}
            <Button onClick={deleteNode} variant="outline" className="mt-2 p-2 block ml-auto justify-end">Delete</Button>
          </div>
        )}

        
      </PopoverContent>
      )}
    </Popover>
  )
}
