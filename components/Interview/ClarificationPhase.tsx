"use client"

import { useEffect, useRef } from "react"
import { useInterview } from "./InterviewProvider"
import InterviewShell from "./InterviewShell"
import TranscriptPanel from "./TranscriptPanel"
import NotesPanel from "./NotesPanel"
import { InterviewSidebar } from "./InterviewSidebar/InterviewSidebar"
import { Loader2 } from "lucide-react"

export function ClarificationPhase() {
  const { startInterview, session, toggleCall, isSessionActive, navDirection } = useInterview()
  const startedRef = useRef(false)
  const hasConnectedRef = useRef(false)

  useEffect(() => {
    startInterview()
  }, [startInterview])

  useEffect(() => {
    // Auto-start once when overrides are available and not navigating backward
    if (navDirection === "backward") return
    if (startedRef.current) return
    const overrides = session?.clarificationOverrides
    if (!isSessionActive && overrides && Object.keys(overrides).length > 0) {
      startedRef.current = true
      toggleCall("clarification", overrides)
    }
  }, [isSessionActive, toggleCall, navDirection, session?.clarificationOverrides])

  // Mark that we've connected at least once
  if (isSessionActive && !hasConnectedRef.current) {
    hasConnectedRef.current = true
  }

  // Show loader only before first connection
  if (!isSessionActive && !hasConnectedRef.current) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <div className="text-sm text-gray-300">Connecting to interviewer…</div>
        </div>
      </div>
    )
  }

  return (
    <InterviewShell
      left={<TranscriptPanel />}
      middle={<InterviewSidebar />}
      right={undefined}
    />
  )
}
