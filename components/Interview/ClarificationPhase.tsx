"use client"

import { useEffect, useRef } from "react"
import { useInterview } from "./InterviewProvider"
import InterviewShell from "./InterviewShell"
import TranscriptPanel from "./TranscriptPanel"
import NotesPanel from "./NotesPanel"
import { InterviewSidebar } from "./InterviewSidebar/InterviewSidebar"

export function ClarificationPhase() {
  const { startInterview, session, toggleCall, isSessionActive, navDirection } = useInterview()
  const startedRef = useRef(false)

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

  return (
    <InterviewShell
      left={<TranscriptPanel />}
      middle={<InterviewSidebar />}
      right={undefined}
    />
  )
}
