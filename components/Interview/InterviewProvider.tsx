'use client'
import { createContext, useContext, useState, useCallback } from "react"
import Vapi from "@vapi-ai/web"

type InterviewPhase = "clarification" | "diagram" | "deep-dive" | "feedback"

type InterviewSession = {
  id: string | null
  phase: InterviewPhase
  problem_display_data: Record<string, any>
  vapiAgent?: Vapi
  clarificationNotes: string
}

type InterviewContextType = {
  session: InterviewSession
  startInterview: () => Promise<void>
  startDeepDive: () => Promise<void>
  finishInterview: () => Promise<void>
  nextPhase: (notes?: string) => void
  getCurrentPhaseNotes: () => string
  setCurrentPhaseNotes: (notes: string) => void
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined)

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<InterviewSession>({
    id: null,
    problem_display_data: {},
    phase: "clarification",
    clarificationNotes: "",
  })
  
  // Current phase notes (temporary state for active phase)
  const [currentPhaseNotes, setCurrentPhaseNotes] = useState("")

  const vapi_key: string = process.env.NEXT_PUBLIC_VAPI_CLIENT_API_KEY!

  const startInterview = useCallback(async () => {
    try {

        console.log("interview started")

      /*const res = await fetch("/api/interview/start-interview", { method: "POST"})
      
      if (!res.ok) {
        throw new Error(`API call failed: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (!data.vapi_clarification_assistant) {
        throw new Error("No assistant ID received from backend")
      }

      // Create VAPI instance with the assistant_id
      const vapiClient = new Vapi(vapi_key);
      setSession(prev => ({ ...prev, vapiAgent: vapiClient }))
      vapiClient.start(data.vapi_clarification_assistant)
      */

    } catch (error) {
      console.error("Failed to start interview:", error)
    }
  }, [vapi_key])


  async function startDeepDive() {
  }

  async function finishInterview() {

  }

  function nextPhase(notes?: string) {
    if (session.phase === "clarification") {
      // Stop VAPI call
      if (session.vapiAgent) {
        session.vapiAgent.stop()
      }
      
      // Save current phase notes to session
      const notesToSave = notes || currentPhaseNotes
      setSession(prev => ({ 
        ...prev, 
        clarificationNotes: notesToSave,
        phase: "diagram", 
        vapiAgent: undefined
      }))
      
      // Clear current phase notes
      setCurrentPhaseNotes("")
      
      console.log("Moving from clarification to diagram")
    }
  }

  function getCurrentPhaseNotes() {
    return currentPhaseNotes
  }

  return (
    <InterviewContext.Provider
      value={{ session, startInterview, startDeepDive, finishInterview, nextPhase, getCurrentPhaseNotes, setCurrentPhaseNotes }}
    >
      {children}
    </InterviewContext.Provider>
  )
}

export function useInterview() {
  const ctx = useContext(InterviewContext)
  if (!ctx) throw new Error("useInterview must be used within InterviewProvider")
  return ctx
}
