"use client"

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EdgeEditPopover({ edge, onClose, onSave }: any) {
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
            <Input
              className="h-7 text-sm"
              value={form?.data?.type ?? ''}
              onChange={(e) => handleChange('type', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              className="h-7 text-sm"
              value={form?.data?.label ?? ''}
              onChange={(e) => handleChange('label', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input
              className="h-7 text-sm"
              value={form?.data?.description ?? ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </PopoverContent>
      )}
    </Popover>
  )
}
