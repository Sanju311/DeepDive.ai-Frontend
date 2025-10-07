"use client"

import { useInterview } from "../InterviewProvider"
import { Button } from "@/components/ui/button"

export function InterviewPhaseControls() {
  const { nextPhase, getCurrentPhaseNotes } = useInterview()

  const handleNext = () => {
    const currentNotes = getCurrentPhaseNotes()
    nextPhase(currentNotes)
  }

  return (
    <div className="p-4 border-t border-gray-800 flex justify-between">
      <Button variant="secondary" className = "bg-gray-700">
        Back
      </Button>
      <Button onClick={handleNext} className = "bg-purple-600">
        Next
      </Button>
    </div>
  )
}
