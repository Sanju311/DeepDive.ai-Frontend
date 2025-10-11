"use client"

import { useState } from "react"
import { DiagramControls } from "@/components/Interview/DiagramDesignPhase/DiagramControls"
import { DiagramCanvasReactFlowWrapper } from "./DiagramCanvas"
import { useInterview } from "../InterviewProvider"

import { DiagramComponent, DraggingState } from "./types"

// Keep lightweight types for popovers and local helpers
export type Node = {
  id: string
  type: string
  position: { x: number, y: number }
  data: {
    icon?: string
    label: string
    scaling: "none" | "horizontal" | "vertical"
    description: string
  }
}
export type Edge = {
  id: string
  source: string
  target: string
  direction?: "unidirectional" | "bidirectional"
  type: string
  data: {
    label: string
    type: string
    description: string
  }
}

export function DiagramPhase() {

  const components = [
    { id: "client", name: "Client / Browser", icon: "💻" },
    { id: "loadbalancer", name: "Load Balancer", icon: "⚖️" },
    { id: "webserver", name: "Web Server", icon: "🌐" },
    { id: "appserver", name: "Application Server", icon: "🧠" },
    { id: "database", name: "Database", icon: "🗄️" },
    { id: "cache", name: "Cache", icon: "⚡" },
    { id: "queue", name: "Message Queue", icon: "📬" },
    { id: "cdn", name: "CDN", icon: "🌎" },
    { id: "storage", name: "Blob Storage", icon: "🗂️" },
    { id: "auth", name: "Auth Service", icon: "🔐" },
  ]

  const connections = [
    { id: "http", name: "HTTP", icon: "➡️" },
    { id: "websocket", name: "WebSocket", icon: "🔁" },
    { id: "grpc", name: "gRPC", icon: "🔗" },
    { id: "database_query", name: "DB Query", icon: "🧾" },
    { id: "cache_hit", name: "Cache Hit", icon: "💥" },
    { id: "queue_message", name: "Message", icon: "📨" },
  ]

  // State now lives inside ReactFlow (DiagramCanvas). No local nodes/edges.

  const [dragging, setDragging] = useState<DraggingState | null>(null) // holds { component, x, y } or null


  //Callback functions for dragging
  const handleStartDrag = (component: DiagramComponent, coords: { x: number, y: number }) => {
    setDragging({component: component, ...coords })
  }
  const handleUpdateDrag = (coords: {x: number, y: number}) => {
    setDragging((g) => (g ? { ...g, ...coords } : g))
  }
  const handleEndDrag = () => {
    setDragging(null)
  }

  // Node/edge updates handled inside DiagramCanvas


  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Diagram Phase</h1>
        <p className="text-gray-400 text-sm">
          Design your system architecture by adding components and connections to the canvas.
        </p>
      </header>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <DiagramControls 
          components={components} 
          onStartDrag={handleStartDrag}
          onUpdateDrag={handleUpdateDrag}
        />
        <DiagramCanvasReactFlowWrapper 
          dragging={dragging}
          onEndDrag={handleEndDrag}
        />
        {dragging && (
        <div
          className="fixed pointer-events-none rounded-lg border w-20 h-20
                    border-border bg-card shadow-lg p-3 flex text-center
                    flex-col items-center justify-center z-50"
          style={{
            top: dragging.y,
            left: dragging.x,
            transform: "translate(-50%, -50%)",
            opacity: 0.8,
            zIndex: 50,
          }}
        >
          <span className="text-lg">{dragging.component.icon}</span>
          <span className="text-xs font-medium mt-1">
            {dragging.component.name}
          </span>
        </div>
      )}

      </div>
    </div>
  )
}