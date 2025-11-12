"use client"

import { useInterview } from "./InterviewProvider"

export default function NotesPanel() {
  const { setCurrentPhaseNotes } = useInterview()
  return (
    <textarea
      className="w-full h-full bg-background border border-gray-700 rounded-lg p-4 text-sm resize-none dark-scroll"
      placeholder="Write any notes want to take here..."
      onChange={(e) => setCurrentPhaseNotes(e.target.value)}
    />
  )
}


