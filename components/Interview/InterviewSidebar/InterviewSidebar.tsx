"use client"

import { useInterview } from "../InterviewProvider"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"

export function InterviewSidebar() {
  const { session, nextPhase, previousPhase, getCurrentPhaseNotes, setCurrentPhaseNotes } = useInterview()

  const currSession = session
  const currProblemDisplayData = currSession.problem_display_data


  const handleNext = () => {
    const currentNotes = getCurrentPhaseNotes()
    nextPhase(currentNotes)
  }

  const defaultReqOpen = currSession.phase === "clarification"
  const [reqOpen, setReqOpen] = useState(defaultReqOpen)

  const functionalReqs: string[] = useMemo(() => {
    const d: any = currProblemDisplayData || {}
    return d.functional_requirements || d.functionalRequirements || d.functional || []
  }, [currProblemDisplayData])
  const nonFunctionalReqs: string[] = useMemo(() => {
    const d: any = currProblemDisplayData || {}
    return d.non_functional_requirements || d.nonFunctionalRequirements || d.nonFunctional || []
  }, [currProblemDisplayData])

  return (
    <aside className="h-full p-4 flex flex-col">
      {/* Problem Details */}
      <div className="pt-1 pb-3  px-3 border-b">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-lg">
            1. {currProblemDisplayData?.name}
          </h2>
          {(() => {
            const diffRaw = (currProblemDisplayData?.difficulty || "")
            const diff = diffRaw.toLowerCase()
            const diffDisplay = diff ? diff.charAt(0).toUpperCase() + diff.slice(1) : ""
            const diffClass =
              diff === "easy"
                ? "bg-green-900/40 text-green-300 border-green-700"
                : diff === "medium"
                ? "bg-yellow-900/40 text-yellow-300 border-yellow-700"
                : diff === "hard"
                ? "bg-red-900/40 text-red-300 border-red-700"
                : "bg-gray-800 text-gray-300 border-gray-700"
            return currProblemDisplayData?.difficulty ? (
              <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm ${diffClass}`}>
                {diffDisplay}
              </span>
            ) : null
          })()}
        </div>
      </div>
      {currProblemDisplayData?.description && (
        <div className="p-3">
          <div className="border-gray-800 pt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-300 font-semibold">Problem Info</p>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                onClick={() => setReqOpen((v) => !v)}
              >

                {reqOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-400">
              {currProblemDisplayData.description}
            </p>
          </div>
        </div>
      )}

      {/* Requirements dropdown content */}
      {reqOpen && (
        <div className="p-3 space-y-3 text-sm">
          {functionalReqs?.length > 0 && (
            <div>
              <p className="text-gray-300 font-semibold">Functional Requirements</p>
              <ul className="mt-1 list-disc list-outside pl-5 text-gray-400 space-y-0.5 marker:text-gray-500">
                {functionalReqs.map((r, i) => (
                  <li key={`fr-${i}`}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {nonFunctionalReqs?.length > 0 && (
            <div>
              <p className="text-gray-300 font-semibold">Non-Functional Requirements</p>
              <ul className="mt-1 list-disc list-outside pl-5 text-gray-400 space-y-0.5 marker:text-gray-500">
                {nonFunctionalReqs.map((r, i) => (
                  <li key={`nfr-${i}`}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {(!functionalReqs?.length && !nonFunctionalReqs?.length) && (
            <p className="text-gray-500 italic">No requirements provided.</p>
          )}
        </div>
      )}

      {/* User Notes */}
      <div className="flex-1 p-3">
        <h3 className="font-semibold mb-2">Notes</h3>
        <textarea
          aria-label="Interview notes"
          className="w-full h-40 bg-gray-900 border border-gray-700 rounded p-2 text-sm overflow-y-auto resize-none dark-scroll text-gray-200 placeholder:text-gray-500"
          placeholder="Write notes here..."
          value={getCurrentPhaseNotes() || currSession.clarificationNotes || ""}
          onChange={(e) => setCurrentPhaseNotes(e.target.value)}
        />
      </div>

      {/* Phase Controls */}
      <div className="pt-4 pb-1 px-3 border-t border-gray-800 flex justify-between items-center">
        <Button variant="secondary" className="bg-gray-700" onClick={previousPhase}>
          Back
        </Button>
        <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
          Next
        </Button>
      </div>
    </aside>
  )
}
