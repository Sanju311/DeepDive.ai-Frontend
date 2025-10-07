"use client"

import { useEffect } from "react"
import { useInterview } from "./InterviewProvider"

export function ClarificationPhase() {
  const { startInterview, session, setCurrentPhaseNotes } = useInterview()

  useEffect(() => {
    // Start interview and VAPI connection on mount
    startInterview()
  }, [startInterview])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Clarification Phase</h1>
        <p className="text-gray-400 text-sm">
          Use this stage to clarify requirements and jot down your understanding of the problem.
        </p>
      </header>

      {/* Main textarea */}
      <section className="flex-1">
        <textarea
          className="w-full h-full bg-background border border-gray-700 rounded-lg p-4 text-sm resize-none scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          placeholder="Write your clarifications here..."
          onChange={(e) => setCurrentPhaseNotes(e.target.value)}
        />
      </section>
    </div>
  )
}
