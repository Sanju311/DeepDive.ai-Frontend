"use client"

import { useState } from "react"
import { ComponentPanel } from "@/components/Interview/DiagramDesignPhase/ComponentPanel"
import { DiagramCanvasReactFlowWrapper } from "./DiagramCanvas"
import InterviewShell from "../InterviewShell"
import { InterviewSidebar } from "../InterviewSidebar/InterviewSidebar"

import { DiagramComponent, DraggingState, components } from "./types"


export function DiagramPhase() {

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

  return (
    <>
      <InterviewShell
        leftWidth="14rem"
        left={
          <ComponentPanel 
            components={components} 
            onStartDrag={handleStartDrag}
            onUpdateDrag={handleUpdateDrag}
          />
        }
        middle={
          <DiagramCanvasReactFlowWrapper 
            dragging={dragging}
            onEndDrag={handleEndDrag}
          />
        }
        right={<InterviewSidebar />}
      />
      {dragging && (
        <div
          className="fixed pointer-events-none rounded-lg border w-20 h-20 border-border bg-card shadow-lg p-3 flex text-center flex-col items-center justify-center z-50"
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
    </>
  )
}