"use client"

import { Card } from "@/components/ui/card"
import { DiagramComponent } from "./types"

export function ComponentPanel({
  components,
  onStartDrag,
  onUpdateDrag,
}: {
  components: DiagramComponent[]
  onStartDrag: (component: any, position: { x: number, y: number }) => void
  onUpdateDrag: (position: { x: number, y: number }) => void
}) {

  const handleStartDrag = (event: React.MouseEvent<HTMLDivElement>, component: DiagramComponent) => {
    event.preventDefault()
    onStartDrag(component, { x: event.clientX, y: event.clientY })
    const handleMove = (ev: MouseEvent) => onUpdateDrag({ x: ev.clientX, y: ev.clientY })
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
  }

  return (
    <Card className=" h-fulloverflow-y-auto flex flex-col border-none">
      {/* Header */}
      <div className="px-1 pb-2 flex justify-center">
        <p className="text-lg font-bold tracking-wide text-muted-foreground uppercase">Components</p>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 content-start">
        {components.map((c) => (
          <div
            key={c.id}
            onMouseDown={(e) => handleStartDrag(e, c)}
            className="cursor-grab active:cursor-grabbing rounded-lg border border-border bg-card/70 flex flex-col items-center justify-center text-center hover:bg-accent transition-colors w-full aspect-square"
          >
            <span className="text-2xl">{c.icon}</span>
            <span className="text-xs font-medium mt-1 px-2 leading-tight line-clamp-2">{c.name}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
