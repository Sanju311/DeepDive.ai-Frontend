"use client"

import { useInterview } from "../InterviewProvider"
import { Button } from "@/components/ui/button"

export function InterviewSidebar() {
  const { session, nextPhase, previousPhase, getCurrentPhaseNotes } = useInterview()

  const handleNext = () => {
    const currentNotes = getCurrentPhaseNotes()
    nextPhase(currentNotes)
  }

  return (
    <aside className="h-full p-4 flex flex-col">
      {/* Problem Details */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-bold text-lg">[Problem Title]</h2>
        <p className="text-sm text-gray-400">[Problem description goes here]</p>
      </div>

      {/* User Notes */}
      <div className="flex-1 p-4">
        <h3 className="font-semibold mb-2">Notes</h3>
        <div className="w-full h-40 bg-gray-800 border border-gray-700 rounded p-2 text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {session.clarificationNotes ? (
            <p className="text-gray-300 whitespace-pre-wrap">{session.clarificationNotes}</p>
          ) : (
            <p className="text-gray-500 italic">No notes saved yet</p>
          )}
        </div>
      </div>

      {/* Phase Controls */}
      <div className="p-4 border-t border-gray-800 flex justify-between">
        <Button variant="secondary" className="bg-gray-700" onClick={previousPhase}>
          Back
        </Button>
        <Button onClick={handleNext} className="bg-purple-600">
          Next
        </Button>
      </div>
    </aside>
  )
}
