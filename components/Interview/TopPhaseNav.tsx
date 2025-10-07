"use client"

import { useInterview } from "./InterviewProvider"
import { cn } from "@/lib/utils"

export function TopPhaseNav() {
  const { session } = useInterview()

  const phases = [
    { id: "clarification", label: "Clarification" },
    { id: "diagram", label: "Diagram" },
    { id: "deep-dive", label: "Deep Dive" },
  ]

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center justify-evenly bg-gray-800 rounded-lg p-3 shadow-md w-1/2 border">
        {phases.map((phase) => (
          <p
            key={phase.id}
            className={cn(
              "text-sm px-4 py-2 rounded-lg transition-all",
              session.phase === phase.id
                ? "bg-purple-600 text-white font-semibold"
                : "text-gray-400"
            )}
          >
            {phase.label}
          </p>
        ))}
      </div>
    </div>
  )
}
