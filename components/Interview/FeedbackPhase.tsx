"use client"

import { useEffect, useRef, useState } from "react"
import { useInterview } from "./InterviewProvider"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopPhaseNav } from "./TopPhaseNav"

type FeedbackResponse = {
  success?: boolean
  feedback?: any
  [key: string]: any
}

type CategoryFeedback = { score: number; feedback: string }

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
  const { session, setDeepdiveFeedback } = useInterview()
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("We’re evaluating your session. This may take a little while...")
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
            console.log("Feedback:", data?.feedback)
            if (data?.feedback) {
              setDeepdiveFeedback(data.feedback)
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
  const keys = feedback ? Object.keys(feedback) : []

  if (isLoading || !feedback || keys.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto p-8">
      <div className="w-[90%] max-w-6xl mx-auto space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {keys.map((key) => {
            const cf = feedback[key]
            const title = key.charAt(0).toUpperCase() + key.slice(1)
            return (
              <Card key={key} className="border-zinc-800 bg-zinc-950 p-">
                <CardHeader className="pt-6 pb-0 px-6">
                  <CardTitle className="text-lg md:text-xl text-white">{title}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4 flex flex-col gap-6">
                  <div className="w-full flex justify-center py-2">
                    <RadialGauge score={cf?.score ?? 0} size={192} strokeWidth={16} />
                  </div>
                  <div className="text-base leading-7 text-gray-300 text-left">
                    {cf?.feedback || "No feedback provided."}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="pt-6 pb-0 px-6">
            <CardTitle className="text-lg md:text-xl text-white">Overall Pros & Cons</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="text-base font-semibold text-green-400 mb-3">Pros</div>
                <ul className="list-disc list-inside text-base leading-7 text-gray-300">
                  <li>Coming soon</li>
                </ul>
              </div>
              <div>
                <div className="text-base font-semibold text-red-400 mb-3">Cons</div>
                <ul className="list-disc list-inside text-base leading-7 text-gray-300">
                  <li>Coming soon</li>
                </ul>
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
        <div className="flex-1 min-h-0 mt-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <FeedbackContent />
          </div>
        </div>
      </div>
    </div>
  )
}
