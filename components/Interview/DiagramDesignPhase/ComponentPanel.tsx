"use client"

import { Card } from "@/components/ui/card"
import { DiagramComponent } from "./types"
import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"

export function ComponentPanel({
  components,
  onStartDrag,
  onUpdateDrag,
}: {
  components: DiagramComponent[]
  onStartDrag: (component: any, position: { x: number, y: number }) => void
  onUpdateDrag: (position: { x: number, y: number }) => void
}) {

  const [search, setSearch] = useState("")
  const filteredComponents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return components
    return components.filter((c) => c.name?.toLowerCase().includes(q))
  }, [components, search])

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
    <Card className=" h-full flex flex-col border-none space-y-2">
      {/* Header */}
      <div className="px-1 flex justify-center bg-background">
        <p className="m- text-lg font-semibold text-muted-foreground uppercase">Components</p>
      </div>
      {/* Search */}
      <div >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components..."
          className="h-9 bg-background text-secondary-foreground border-border placeholder:text-muted-foreground"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 content-start bg-background dark-scroll overflow-y-auto">
        {filteredComponents.map((c) => (
          <div
            key={c.id}
            onMouseDown={(e) => handleStartDrag(e, c)}
            className="cursor-grab active:cursor-grabbing rounded-lg border border-border bg-background flex flex-col items-center justify-center text-center hover:bg-accent transition-colors w-full aspect-square"
          >
            <span className="text-2xl">{c.icon}</span>
            <span className="text-xs font-medium mt-1 px-2 leading-tight line-clamp-2">{c.name}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
