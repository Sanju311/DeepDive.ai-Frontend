"use client"

import { useMemo } from "react"
import { useInterview } from "./InterviewProvider"
import InterviewShell from "./InterviewShell"
import TranscriptPanel from "./TranscriptPanel"
import { InterviewSidebar } from "./InterviewSidebar/InterviewSidebar"
import { DiagramCanvasReactFlowWrapper } from "./DiagramDesignPhase/DiagramCanvas"

export function DeepDivePhase() {
  const { diagramSnapshot } = useInterview()

  const nodes = diagramSnapshot?.nodes ?? []
  const edges = diagramSnapshot?.edges ?? []

  // Simple read-only node renderer to match diagram styling
  const NODE_WIDTH = 80
  const NODE_HEIGHT = 80
  const DisplayNode = ({ data }: any) => {
    return (
      <div
        style={{ width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px` }}
        className="relative rounded-md text-center shadow-sm select-none"
      >
        <div
          className="absolute rounded-md border border-border bg-card p-2 z-10 flex flex-col items-center justify-center gap-1"
          style={{ top: '5%', left: '5%', right: '5%', bottom: '5%' }}
        >
          <span className="text-xl">{data?.icon}</span>
          <span className="text-xs font-semibold text-foreground text-center break-words leading-tight max-w-[6rem]">
            {data?.label || ""}
          </span>
          <span className="text-[10px] text-muted-foreground italic leading-none">
            {data?.type || "component"}
          </span>
        </div>
      </div>
    )
  }

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