"use client"

import React from "react"
import { useInterview } from "./InterviewProvider"
import { TopPhaseNav } from "./TopPhaseNav"

type InterviewShellProps = {
  left: React.ReactNode
  middle: React.ReactNode
  right?: React.ReactNode
  leftWidth?: string
  rightWidth?: string
}

const PHASE_META: Record<string, { title: string; desc: string }> = {
  clarification: {
    title: "Clarification Phase",
    desc: "Use this stage to clarify requirements and jot down your understanding.",
  },
  diagram: {
    title: "Diagram Design Phase",
    desc: "Create and refine the system diagram from reusable components.",
  },
  "deep-dive": {
    title: "Deep Dive Phase",
    desc: "Walk through tradeoffs and bottlenecks, iterating on the diagram.",
  },
  feedback: {
    title: "Feedback",
    desc: "Wrap up and review key points.",
  },
}

export default function InterviewShell({ left, middle, right, leftWidth = "22rem", rightWidth = "24rem" }: InterviewShellProps) {
  const { session } = useInterview()
  const meta = PHASE_META[session.phase] ?? PHASE_META.clarification

  return (
    <div className="flex h-screen bg-background text-foreground p-6 gap-4">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-2 ">
          <div className="pr-4">
            <h1 className="text-2xl font-bold">{meta.title}</h1>
            <p className="text-gray-400 text-sm">{meta.desc}</p>
          </div>
          <div className="flex-shrink-0">
            <TopPhaseNav />
          </div>
        </div>

        {/* Body: 2 or 3 columns */}
        {right ? (
          <div
            className="flex-1 mt-6 overflow-hidden min-h-0 grid gap-4"
            style={{ gridTemplateColumns: `${leftWidth} minmax(0,1fr) ${rightWidth}` }}
          >
            <div className="min-h-0 overflow-hidden rounded-lg border border-border p-4">{left}</div>
            <div className="min-h-0 overflow-hidden rounded-lg border border-border p-0 flex flex-col">{middle}</div>
            <div className="min-h-0 overflow-hidden rounded-lg border border-border">{right}</div>
          </div>
        ) : (
          <div
            className="flex-1 mt-6 overflow-hidden min-h-0 grid gap-4"
            style={{ gridTemplateColumns: `minmax(0,1fr) minmax(0,1fr)` }}
          >
            <div className="min-h-0 overflow-hidden rounded-lg border border-border p-4">{left}</div>
            <div className="min-h-0 overflow-hidden rounded-lg border border-border p-0 flex flex-col">{middle}</div>
          </div>
        )}
      </div>
    </div>
  )
}


