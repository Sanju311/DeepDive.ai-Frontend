"use client"

import { ClarificationPhase } from "@/components/Interview/ClarificationPhase"
import { useInterview } from "@/components/Interview/InterviewProvider"
import { DiagramPhase } from "@/components/Interview/DiagramDesignPhase/DiagramPhase"

// import { DiagramPhase } from "@/components/Interview/DiagramPhase"
// import { DeepDivePhase } from "@/components/Interview/DeepDivePhase"

export default function PracticePage() {
  // Temporary phase value — later this will come from global state or backend
  const { session } = useInterview()
  const currentPhase = session.phase

  const renderPhase = () => {
    switch (currentPhase) {
      case "clarification":
        return <ClarificationPhase />
      case "diagram":
        return <DiagramPhase />
      // case "deep-dive":
      //   return <DeepDivePhase />
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            Unknown phase
          </div>
        )
    }
  }

  return <>{renderPhase()}</>
}
