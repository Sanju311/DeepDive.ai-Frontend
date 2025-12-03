"use client"

import { useInterview } from "./InterviewProvider"

export default function NotesPanel() {
  const { setCurrentPhaseNotes } = useInterview()
  return (
    <textarea
      className="w-full h-full bg-gray-900 text-white border border-border rounded-lg p-4 text-sm resize-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark-scroll"
      placeholder="Write any notes want to take here..."
      onChange={(e) => setCurrentPhaseNotes(e.target.value)}
    />
  )
}


