"use client"

import { InterviewProvider, useInterview } from "@/components/Interview/InterviewProvider"
import { ClarificationPhase } from "@/components/Interview/ClarificationPhase"
import { DiagramPhase } from "@/components/Interview/DiagramDesignPhase/DiagramPhase"
import DeepDivePhase from "@/components/Interview/DeepDivePhase"
import FeedbackPhase from "@/components/Interview/FeedbackPhase"

// import { DiagramPhase } from "@/components/Interview/DiagramPhase"
// import { DeepDivePhase } from "@/components/Interview/DeepDivePhase"

function Main() {
  const { session } = useInterview()
  const currentPhase = session.phase
  switch (currentPhase) {
    case "clarification":
      return <ClarificationPhase />
    case "diagram":
      return <DiagramPhase />
    case "deep-dive":
      return <DeepDivePhase />
    case "feedback":
      return <FeedbackPhase />
    default:
      return <div className="flex items-center justify-center h-screen text-gray-400">Unknown phase</div>
  }
}

export default function PracticePage() {
  return (
    <InterviewProvider>
      <Main />
    </InterviewProvider>
  )
}

