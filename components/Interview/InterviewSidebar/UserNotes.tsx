"use client"

import { useInterview } from "../InterviewProvider"

export function UserNotes() {
  const { session } = useInterview()

  return (
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
  )
}
