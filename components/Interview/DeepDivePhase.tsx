"use client"

import {useEffect } from "react"
import { useInterview } from "./InterviewProvider"
import InterviewShell from "./InterviewShell"
import TranscriptPanel from "./TranscriptPanel"
import { InterviewSidebar } from "./InterviewSidebar/InterviewSidebar"
import { DiagramCanvasReactFlowWrapper } from "./DiagramDesignPhase/DiagramCanvas"

export function DeepDivePhase() {
  
  const { session, toggleCall, isSessionActive } = useInterview()
  useEffect(() => {
    if (session.deepdiveAssistantID && !isSessionActive) {
      toggleCall(session.deepdiveAssistantID)
    }
  }, [session.deepdiveAssistantID, isSessionActive, toggleCall])


  const middle = <DiagramCanvasReactFlowWrapper dragging={null} onEndDrag={() => {}} readOnly />

  return (
    <InterviewShell
      left={<TranscriptPanel />}
      middle={middle}
      right={<InterviewSidebar />}
    />
  )
}

export default DeepDivePhase