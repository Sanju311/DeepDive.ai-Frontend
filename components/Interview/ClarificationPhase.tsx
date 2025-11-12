"use client"

import { useEffect } from "react"
import { useInterview } from "./InterviewProvider"
import InterviewShell from "./InterviewShell"
import TranscriptPanel from "./TranscriptPanel"
import NotesPanel from "./NotesPanel"
import { InterviewSidebar } from "./InterviewSidebar/InterviewSidebar"

export function ClarificationPhase() {
  const { startInterview, session, toggleCall, isSessionActive } = useInterview()

  useEffect(() => {
    startInterview()
  }, [startInterview])

  useEffect(() => {
    if (session.clarificationAssistantId && !isSessionActive) {
      toggleCall(session.clarificationAssistantId)
    }
  }, [session.clarificationAssistantId, isSessionActive, toggleCall])

  return (
    <InterviewShell
      left={<TranscriptPanel />}
      middle={<NotesPanel />}
      right={<InterviewSidebar />}
    />
  )
}
