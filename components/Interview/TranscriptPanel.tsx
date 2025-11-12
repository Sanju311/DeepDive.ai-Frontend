"use client"

import { useEffect, useRef } from "react"
import { useInterview } from "./InterviewProvider"
import RadialCard from "./vapi/audio-visualizer"

export default function TranscriptPanel() {
  const { conversation } = useInterview()
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [conversation])

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Audio visualizer */}
      <div className="rounded-lg h-48 flex items-center justify-center">
        <RadialCard />
      </div>

      {/* Transcript list (scrollable) */}
      <div
        className="flex-1 min-h-0 rounded-lg  p-3 bg-black/30 overflow-y-auto dark-scroll"
        ref={transcriptRef}
      >
        {conversation.map((m: { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }, idx: number) => {
          const committed = m.committedChars ?? (m.isFinal ? m.text.length : 0)
          const committedText = m.text.slice(0, committed)
          const partialText = m.text.slice(committed)
          return (
          <div key={idx} className="mb-1 leading-snug">
            <span
              className={`mr-2 text-[11px] text-zinc-500 align-middle`}
            >
              {m.timestamp}
            </span>
            <span
              className={`mr-2 text-xs font-semibold uppercase ${
                m.role === "assistant" ? "text-sky-400" : "text-emerald-400"
              }`}
            >
              {m.role === "assistant" ? "AGENT" : "YOU"}:
            </span>
            <span className="text-sm text-zinc-100">{committedText}</span>
            {partialText && <span className="text-sm text-zinc-400 italic">{partialText}</span>}
          </div>
        )})}
      </div>
    </div>
  )
}

