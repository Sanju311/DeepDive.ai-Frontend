"use client"

import {useEffect, useRef } from "react"
import { useInterview } from "./InterviewProvider"
import InterviewShell from "./InterviewShell"
import TranscriptPanel from "./TranscriptPanel"
import { InterviewSidebar } from "./InterviewSidebar/InterviewSidebar"
import { DiagramCanvasReactFlowWrapper } from "./DiagramDesignPhase/DiagramCanvas"
import { Loader2 } from "lucide-react"

export function DeepDivePhase() {
  
  const { session, toggleCall, isSessionActive, navDirection, configureDeepDive } = useInterview()
  const startedRef = useRef(false)
  useEffect(() => {
    // Auto-start once when overrides are available and not navigating backward
    if (navDirection === "backward") return
    if (startedRef.current) return
    const overrides = session?.deepdiveOverrides
    if (!isSessionActive && overrides && Object.keys(overrides).length > 0) {
      startedRef.current = true
      // Configure deep-dive meta (session/category order) separately from overrides
      configureDeepDive(session.id, session.deepdiveCategoryOrderList || [])
      toggleCall("deep-dive", overrides)
    }
  }, [isSessionActive, toggleCall, navDirection, session?.deepdiveOverrides, session?.deepdiveCategoryOrderList, session?.id, configureDeepDive])


  const middle = <DiagramCanvasReactFlowWrapper dragging={null} onEndDrag={() => {}} readOnly />

  if (!isSessionActive) {
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
      middle={middle}
      right={<InterviewSidebar />}
    />
  )
}

export default DeepDivePhase