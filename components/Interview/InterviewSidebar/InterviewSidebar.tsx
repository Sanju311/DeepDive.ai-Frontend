"use client"

import { ProblemDetails } from "./ProblemDetails"
import { UserNotes } from "./UserNotes"
import { InterviewPhaseControls } from "./InterviewPhaseControls"

export function InterviewSidebar() {
  return (
    <aside className="h-full bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col">
      <ProblemDetails />
      <UserNotes />
      <InterviewPhaseControls />
    </aside>
  )
}
