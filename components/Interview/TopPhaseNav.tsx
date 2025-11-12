"use client"

import React from "react"
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
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-3xl px-4 py-3">
        <div className="flex items-center w-full">
          {phases.map((phase, idx) => {
            const currentIdx = phases.findIndex(p => p.id === session.phase)
            const isCompleted = idx < currentIdx
            const isCurrent = idx === currentIdx
            return (
              <React.Fragment key={phase.id}>
                <span
                  className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium select-none",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-purple-600 text-white ring-4 ring-purple-500/20"
                        : "bg-zinc-700 text-zinc-300"
                  )}
                >
                  {idx + 1}. {phase.label}
                </span>
                {idx < phases.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 min-w-16 sm:min-w-24 md:min-w-16 h-1 mx-4 rounded-full",
                      idx < currentIdx
                        ? "bg-emerald-500"
                          : "bg-zinc-700"
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
