"use client"

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CONNECTION_TYPES } from "./types"
import { toast } from "sonner"

export function EdgeEditPopover({ edge, onClose, onSave, onDelete }: any) {
  const [form, setForm] = useState<any>(edge)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setForm(edge), [edge])

  // Position near the edge midpoint; clamp inside canvas bounds. Retry until DOM is ready.
  useEffect(() => {
    if (!edge) return
    let cancelled = false
    let attempts = 0
    const MAX_ATTEMPTS = 6

    const measure = () => {
      if (cancelled) return
      const sourceEl = document.querySelector(
        `.react-flow__node[data-id="${edge.source}"]`
      ) as HTMLElement | null
      const targetEl = document.querySelector(
        `.react-flow__node[data-id="${edge.target}"]`
      ) as HTMLElement | null
      const canvasEl = document.querySelector('.react-flow') as HTMLElement | null
      if (!sourceEl || !targetEl || !canvasEl) {
        if (attempts++ < MAX_ATTEMPTS) requestAnimationFrame(measure)
        return
        }

      const s = sourceEl.getBoundingClientRect()
      const t = targetEl.getBoundingClientRect()
      const canvasRect = canvasEl.getBoundingClientRect()

      const midX = (s.left + s.right) / 2
      const midY = (s.top + s.bottom) / 2
      const midX2 = (t.left + t.right) / 2
      const midY2 = (t.top + t.bottom) / 2
      const cx = (midX + midX2) / 2 + window.scrollX
      const cy = (midY + midY2) / 2 + window.scrollY

      const OFFSET = 8
      const POPOVER_WIDTH = 256
      const popoverHeight = contentRef.current?.offsetHeight || 180

      const canvasTop = canvasRect.top + window.scrollY
      const canvasLeft = canvasRect.left + window.scrollX
      const canvasRight = canvasLeft + canvasRect.width
      const canvasBottom = canvasTop + canvasRect.height

      let top = cy + OFFSET
      let left = cx - POPOVER_WIDTH / 2

      if (top + popoverHeight > canvasBottom) top = cy - popoverHeight - OFFSET
      if (left < canvasLeft) left = canvasLeft + OFFSET
      if (left + POPOVER_WIDTH > canvasRight) left = canvasRight - POPOVER_WIDTH - OFFSET
      if (top < canvasTop) top = canvasTop + OFFSET

      setCoords({ top, left })
    }

    const raf = requestAnimationFrame(measure)
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [edge])

  const handleChange = (field: 'label' | 'type' | 'description', value: string) => {
    setForm((prev: any) => ({ ...prev, data: { ...prev.data, [field]: value } }))
  }

  const handleValueChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, data: { ...prev.data, values: { ...(prev.data?.values || {}), [key]: value } } }))
  }

  const handleClose = () => {
    if (form) onSave(form)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleClose()
    }
  }

  const deleteEdge = () => {
    if (!form?.id) return
    onDelete?.(form.id)
    onClose()
  }

  // Determine valid type options: either provided on edge, or fallback to all
  const validTypeOptions = (form?.data?._validTypes && Array.isArray(form.data._validTypes) && form.data._validTypes.length > 0)
    ? form.data._validTypes
    : CONNECTION_TYPES.map(t => ({ id: t.id, name: t.name }))

  // Get schema for selected type
  const selectedType = form?.data?.type
  const selectedTypeDef = CONNECTION_TYPES.find(t => t.id === selectedType)
  const schema = selectedTypeDef?.schema

  return (
    <Popover open={!!edge} onOpenChange={(open) => !open && handleClose()}>
      {coords && (
        <PopoverContent
          ref={contentRef}
          side="top"
          align="center"
          className="w-64 p-3 space-y-2 border shadow-md rounded-lg bg-background"
          onKeyDown={handleKeyDown}
          style={{ position: 'fixed', left: coords.left, top: coords.top }}
        >
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={form?.data?.type ?? ''}
              onValueChange={(v) => {
                const def = CONNECTION_TYPES.find(t => t.id === v)
                setForm((prev: any) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    type: v,
                    schema: def?.schema,
                    values: def ? Object.fromEntries(Object.entries(def.schema).map(([k, d]: any) => {
                      if (Array.isArray(d)) return [k, d[0] ?? ""]
                      if (d === "number") return [k, 0]
                      if (d === "boolean") return [k, false]
                      return [k, ""]
                    })) : {},
                  }
                }))
              }}
            >
              <SelectTrigger className="h-7 text-sm">
                <SelectValue placeholder="Select connection type" />
              </SelectTrigger>
              <SelectContent>
                {validTypeOptions.map((opt: any) => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Display Label</Label>
            <Input
              className="h-7 text-sm"
              value={form?.data?.label ?? ''}
              onChange={(e) => handleChange('label', e.target.value)}
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
                placeholder="Optionally describe the connection..."
              />
          </div>

          {/* Dynamic fields for selected type */}
          {schema && (
            <div className="space-y-2">
              {Object.entries(schema).map(([key, def]: any) => {
                const value = form?.data?.values?.[key]
                const label = key.charAt(0).toUpperCase() + key.slice(1)

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

                if (def === 'number') {
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

                if (def === 'boolean') {
                  return (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Select value={String(value)} onValueChange={(v) => handleValueChange(key, v === 'true')}>
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

                return (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      className="h-7 text-sm"
                      value={value ?? ''}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          )}
          <Button onClick={deleteEdge} variant="outline" className="mt-2 p-2 block ml-auto justify-end">Delete</Button>
        </PopoverContent>
      )}
    </Popover>
  )
}
