"use client"

import { ReactNode } from "react"
import { TopPhaseNav } from "@/components/Interview/TopPhaseNav"
import { InterviewSidebar } from "@/components/Interview/InterviewSidebar/InterviewSidebar"
import { InterviewProvider } from "@/components/Interview/InterviewProvider"

export default function PracticeLayout({ children }: { children: ReactNode }) {
  return (
    <InterviewProvider>
      <div className="flex h-screen bg-gray-950 text-white p-4 gap-4">
        {/* Left Column - Main Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Navigation (phase tracker + controls) */}
          <TopPhaseNav />

          {/* Main content below */}
          <div className="flex-1 mt-4 border rounded-lg p-6">
            {children}
          </div>
        </div>

        {/* Right Column - Sidebar Box */}
        <div className="w-96">
          <InterviewSidebar />
        </div>
      </div>
    </InterviewProvider>
  )
}
