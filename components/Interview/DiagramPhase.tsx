"use client"

import { useState } from "react"
import { DiagramControls } from "@/components/Interview/DiagramControls"
import { DiagramCanvas } from "./DiagramCanvas"

export function DiagramPhase() {
  return (
    <div className="flex flex-col h-full">
      {/* Header - Row 1 */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Diagram Phase</h1>
        <p className="text-gray-400 text-sm">
          Design your system architecture by adding components and connections to the canvas.
        </p>
      </header>

      {/* Main Content - Remaining height split into left controls and right canvas */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Diagram Controls (Components/Connections) */}
        <DiagramControls />

        {/* Right: Whiteboard Canvas */}
        <DiagramCanvas />
      </div>
    </div>
  )
}