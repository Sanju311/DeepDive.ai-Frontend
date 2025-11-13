"use client"

import { useEffect } from "react"
import { useInterview } from "./InterviewProvider"
import InterviewShell from "./InterviewShell"
import TranscriptPanel from "./TranscriptPanel"
import NotesPanel from "./NotesPanel"
import { InterviewSidebar } from "./InterviewSidebar/InterviewSidebar"

export function ClarificationPhase() {
  const { startInterview, session, toggleCall, isSessionActive, navDirection } = useInterview()

  useEffect(() => {
    startInterview()
  }, [startInterview])

  useEffect(() => {
    // Auto-start only when not coming from a backward navigation
    if (session.clarificationAssistantId && !isSessionActive && navDirection !== "backward") {
      toggleCall(session.clarificationAssistantId)
    }
  }, [session.clarificationAssistantId, isSessionActive, toggleCall, navDirection])

  return (
    <InterviewShell
      left={<TranscriptPanel />}
      middle={<NotesPanel />}
      right={<InterviewSidebar />}
    />
  )
}
