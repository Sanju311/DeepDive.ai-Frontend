'use client'
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import useVapi from "@/hooks/use-vapi"

type InterviewPhase = "clarification" | "diagram" | "deep-dive" | "feedback"

type InterviewSession = {
  id: string | null
  phase: InterviewPhase
  problem_display_data: Record<string, any>
  clarificationNotes: string
  clarificationAssistantId?: string | null
  deepdiveAssistantID?: string | null
}

type InterviewContextType = {
  session: InterviewSession
  startInterview: () => Promise<void>
  finishInterview: () => Promise<void>
  nextPhase: (notes?: string) => void
  previousPhase: () => void
  navDirection: "forward" | "backward" | null
  getCurrentPhaseNotes: () => string
  setCurrentPhaseNotes: (notes: string) => void
  diagramSnapshot: { nodes: any[]; edges: any[] } | null
  setDiagramSnapshot: (snapshot: { nodes: any[]; edges: any[] }) => void
  toggleCall: (assistantIdOverride?: string) => Promise<void>
  conversation: { role: string; text: string; timestamp: string; isFinal: boolean }[]
  isSessionActive: boolean
  volumeLevel: number
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined)

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<InterviewSession>({
    id: null,
    problem_display_data: {},
    phase: "clarification",
    clarificationNotes: "",
  })
  const { toggleCall, conversation, isSessionActive, volumeLevel } = useVapi({ assistantId: undefined })
  
  // Current phase notes (temporary state for active phase)
  const [currentPhaseNotes, setCurrentPhaseNotes] = useState("")
  // Temporary snapshot of diagram until we submit to backend
  const [diagramSnapshot, setDiagramSnapshot] = useState<{ nodes: any[]; edges: any[] } | null>(null)
  // Track navigation direction to control auto-start behavior of calls on mount
  const [navDirection, setNavDirection] = useState<"forward" | "backward" | null>(null)

  const startInterview = useCallback(async () => {
    try {

      console.log("interview started")
      const res = await fetch("/api/interview/start-interview", { method: "POST"})
      
      if (!res.ok) {
        throw new Error(`API call failed: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (!data.vapi_clarification_assistant_id) {
        throw new Error("No assistant ID received from backend")
      }

      if (!data.session_id) {
        throw new Error("No session ID received from backend")
      }
      
      // Store session and assistant id; voice session is managed by phase components via the hook
      setSession(prev => ({ 
        ...prev, 
        id: data.session_id, 
        clarificationAssistantId: data.vapi_clarification_assistant ?? null
      }))

    } catch (error) {
      console.error("Failed to start interview:", error)
    }
  }, [])

  useEffect(() => {
    console.log("session", session);
  }, [session]);

  async function startDeepDive() {
  }

  async function finishInterview() {

  }

  function nextPhase(notes?: string) {
    setNavDirection("forward")
    if (session.phase === "clarification") {
      // end vapi clarification call
      if (isSessionActive) {
        toggleCall()
        console.log("Vapi clarification call ended")
      }
      
      // Save current phase notes to session
      const notesToSave = notes || currentPhaseNotes
      setSession(prev => ({ 
        ...prev, 
        clarificationNotes: notesToSave,
        phase: "diagram", 
      }))
      
      // Clear current phase notes
      setCurrentPhaseNotes("")
      
      console.log("Moving from clarification to diagram")
    } else if (session.phase === "diagram") {
      // Export diagram and submit to API, then advance to deep-dive
      (async () => {
        try {
          if (!diagramSnapshot) {
            console.warn("No diagram snapshot set; cannot finish diagram phase.")
            return
          }

          // Normalize nodes
          const exportedNodes = (diagramSnapshot.nodes || []).map((n: any) => ({
            id: n.id,
            type: n.data?.type || n.type || "component",
            label: n.data?.label ?? "",
            description: n.data?.description ?? "",
            position: n.position,
            values: n.data?.values ?? {},
            icon: n.data?.icon,
            category: n.data?.category,
          }))

          // Normalize edges
          const exportedEdges = (diagramSnapshot.edges || []).map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.data?.type || e.type || "custom",
            label: e.data?.label ?? "",
            description: e.data?.description ?? "",
            values: e.data?.values ?? {},
          }))

          const payload = {
            session_id: session.id,
            phase: "diagram",
            diagram: {
              nodes: exportedNodes,
              edges: exportedEdges,
            },
          }

          const res = await fetch("/api/interview/finish-diagram-phase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!res.ok) {
            console.error("Failed to finish diagram phase:", res.status, await res.text())
            return
          }

          const data = await res.json()

          if (!data.vapi_deepdive_assistant_id) {
            throw new Error("No assistant ID received from backend")
          }

          if (!data.session_id) {
            throw new Error("No session ID received from backend")
          }

          // Store session and assistant id; voice session is managed by phase components via the hook
          setSession(prev => ({ 
            ...prev, 
            id: data.session_id, 
            phase: "deep-dive",
            deepdiveAssistantID: data.vapi_deepdive_assistant_id ?? null
          }))
          console.log("Diagram phase submitted; moving to deep-dive")
        } catch (err) {
          console.error("Error finishing diagram phase:", err)
        }
      })()
  } else if (session.phase === "deep-dive") {
   // transition into feedback phase
   setSession(prev => ({ ...prev, phase: "feedback" }))
   console.log("Transitioning to feedback phase")
  } else {
    console.error("Invalid phase:", session.phase)
  }
}

function previousPhase() {
  setNavDirection("backward")
  // Ensure any active VAPI session is stopped when navigating backward
  if (isSessionActive) {
    toggleCall()
    console.log("Vapi call ended due to navigating to previous phase")
  }
  if (session.phase === "deep-dive") {
    setSession(prev => ({ ...prev, phase: "diagram" }))
  } else if (session.phase === "diagram") {
    setSession(prev => ({ ...prev, phase: "clarification" }))
  }
}

  function getCurrentPhaseNotes() {
    return currentPhaseNotes
  }

  return (
    <InterviewContext.Provider
      value={{ session, startInterview, finishInterview, nextPhase, previousPhase, navDirection, getCurrentPhaseNotes, setCurrentPhaseNotes, diagramSnapshot, setDiagramSnapshot, toggleCall, conversation, isSessionActive, volumeLevel }}
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
