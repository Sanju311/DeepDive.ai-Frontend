"use client"

import { useEffect, useRef, useState } from "react"
import { useInterview } from "./InterviewProvider"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopPhaseNav } from "./TopPhaseNav"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type FeedbackResponse = {
  success?: boolean
  feedback?: any
  [key: string]: any
}

type CategoryFeedback = { score: number; feedback: string }
type CommunicationFeedback = {
  communication_score: number
  communication_feedback: string
  overall_pros?: string[]
  overall_cons?: string[]
}

function scoreColor(score: number) {
  if (score <= 1) return "#ef4444"      // red
  if (score <= 2) return "#f59e0b"      // orange
  if (score <= 3) return "#fbbf24"      // yellow
  if (score <= 4) return "#84cc16"      // light green
  return "#22c55e"                      // bright green
} 

function RadialGauge({ score, size = 96, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const clamped = Math.max(0, Math.min(5, score))
  const targetPct = clamped / 5
  const [displayPct, setDisplayPct] = useState(0)
  useEffect(() => {
    setDisplayPct(0)
    const tid = setTimeout(() => {
      setDisplayPct(targetPct)
    }, 300)
    return () => clearTimeout(tid)
  }, [targetPct])
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - displayPct)
  const track = "#1f2937"
  const bar = scoreColor(clamped)
  return (
    <div style={{ width: size, height: size }} className="relative grid place-items-center">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bar}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1500ms ease-out" }}
        />
      </svg>
      <div className="absolute text-lg font-bold">{clamped} / 5</div>
    </div>
  )
}

function FeedbackContent() {
  const {session, setDeepdiveFeedback } = useInterview()
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("We’re evaluating your session. This may take a little while...")
  const [communication, setCommunication] = useState<CommunicationFeedback | null>(null)
  const stopRef = useRef(false)

  useEffect(() => {
    if (!session.id) return
    stopRef.current = false

    async function poll() {
      if (stopRef.current) return
      try {
        const res = await fetch(`/api/interview/get-feedback?session_id=${encodeURIComponent(session.id || "")}`, {
          method: "GET",
          cache: "no-store",
        })
        if (res.ok) {
          const data: FeedbackResponse = await res.json()
          if (data?.success) { 
            const fb = (data as any)?.feedback ?? {}
            console.log("Feedback:", fb)
            // Extract communication block if present under feedback
            const comm = (fb as any)?.communication
            if (comm) setCommunication(comm)
            // Map feedback categories (excluding 'communication') into expected category_scores shape
            const categories: Record<string, CategoryFeedback> = {}
            Object.entries(fb as Record<string, any>).forEach(([key, value]) => {
              if (key === "communication") return
              if (value && typeof value === "object" && typeof (value as any).score === "number") {
                categories[key] = {
                  score: Number((value as any).score ?? 0),
                  feedback: String((value as any).feedback ?? ""),
                }
              }
            })
            if (Object.keys(categories).length > 0) {
              setDeepdiveFeedback(categories)
            }
            setIsLoading(false)
            setMessage("Feedback is ready.")
            stopRef.current = true
            return
          }
        }
      } catch {
        // swallow and retry
      }
      setTimeout(poll, 2000)
    } 

    poll()
    return () => {
      stopRef.current = true
    }
  }, [session.id])

  const feedback: Record<string, CategoryFeedback> | null = session.deepdiveFeedback || null
  const cats = (feedback || {}) as Record<string, CategoryFeedback>
  // Order categories by rubric order from session; unknowns follow
  const rubricOrder = (session.deepdiveCategoryOrderList || []).map((s) => String(s).toLowerCase())
  const keys = Object.keys(cats).sort((a, b) => {
    const ia = rubricOrder.indexOf(String(a).toLowerCase())
    const ib = rubricOrder.indexOf(String(b).toLowerCase())
    const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia 
    const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
    if (sa !== sb) return sa - sb
    return a.localeCompare(b)
  })

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <div className="text-sm text-gray-300">{message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 pt-2 pb-0">
      <div className="w-[96%] mx-auto space-y-4">
        {(() => {
          const totalCards = (communication ? 1 : 0) + keys.length
          const gaugeSize = totalCards >= 4 ? 160 : totalCards === 3 ? 180 : 200
          const stroke = totalCards >= 4 ? 12 : 14
          const cardMinHeight = totalCards >= 4 ? 420 : 480
          return (
            <div
              className="gap-4"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(totalCards, 1)}, minmax(220px, 1fr))`,
                alignItems: "stretch",
              }}
            >
              
              {/* Category cards in rubric order */}
              {keys.map((key) => {
                const cf = cats[key]
                const title = key.charAt(0).toUpperCase() + key.slice(1)
                return (
                  <Card key={key} className="border-border bg-gray-950 h-full flex flex-col" style={{ minHeight: cardMinHeight }}>
                    <CardHeader className="pt-4 pb-0 px-4">
                      <CardTitle className="text-base md:text-lg text-white">{title}</CardTitle> 
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-3 flex-1 flex flex-col gap-4">
                      <div className="w-full flex justify-center py-1">
                        <RadialGauge score={cf?.score ?? 0} size={gaugeSize} strokeWidth={stroke} />
                      </div>
                      <div className="text-sm md:text-[0.9rem] leading-6 text-gray-300 text-left">
                        {cf?.feedback || "No feedback provided."}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {/* Communication card */}
              {communication && (
                <Card className="border-zinc-800 bg-gray-950 h-full flex flex-col" style={{ minHeight: cardMinHeight }}>
                  <CardHeader className="pt-4 pb-0 px-4">
                    <CardTitle className="text-base md:text-lg text-white">Communication</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-3 flex-1 flex flex-col gap-4">
                    <div className="w-full flex justify-center py-1">
                      <RadialGauge score={Number(communication.communication_score ?? 0)} size={gaugeSize} strokeWidth={stroke} />
                    </div>
                    <div className="text-sm md:text-[0.95rem] leading-6 text-gray-300 text-left">
                      {communication.communication_feedback || "No feedback provided."}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        })()}

        <Card className="border-zinc-800 bg-gray-950">

          <CardContent className="px-6 pb-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="text-lg font-semibold text-green-400 mb-3">Pros</div>
                {Array.isArray(communication?.overall_pros) && communication!.overall_pros!.length > 0 ? (
                  <ul className="list-disc list-outside pl-6 text-sm md:text-base leading-7 text-gray-300">
                    {communication!.overall_pros!.map((p: string, idx: number) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-base leading-7 text-gray-500">No pros provided.</div>
                )}
              </div>
              <div>
                <div className="text-lg font-semibold text-red-400 mb-3">Cons</div>
                {Array.isArray(communication?.overall_cons) && communication!.overall_cons!.length > 0 ? (
                  <ul className="list-disc list-outside pl-6 text-sm md:text-base leading-7 text-gray-300">
                    {communication!.overall_cons!.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-base leading-7 text-gray-500">No cons provided.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function FeedbackPhase() {
  const { session } = useInterview()
  const router = useRouter()
  const meta = { title: "Feedback", desc: "Wrap up and review key points." }
  return (
    <div className="flex h-screen bg-gray-950 text-white p-6">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-start justify-between p-2">
          <div className="pr-4">
            <h1 className="text-2xl font-bold">{meta.title}</h1>
            <p className="text-gray-400 text-sm">{meta.desc}</p>
          </div>
          <div className="flex-shrink-0">
            <TopPhaseNav />
          </div>
        </div>
        <div className="flex-1 min-h-0 mt-4 overflow-auto">
          <div className="max-w-6xl mx-auto pb-4">
            <FeedbackContent />
            {session.deepdiveFeedback && (
              <div className="mt-6 w-full flex items-center justify-center">
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => router.push("/home")}>
                  Finish Interview
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
