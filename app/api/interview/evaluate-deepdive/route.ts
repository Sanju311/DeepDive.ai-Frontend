import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Debug: log inbound proxy payload (non-sensitive)
    console.log("[evaluate-deepdive-category] payload", {
      session_id: body?.session_id,
      category_transcripts: body?.category_transcripts,
      total_transcript: body?.total_transcript,
    })
    // Basic shape passthrough: { session_id, rubric_category, messages: [{role, message}] }
    const result = await apiClient.post("/interview/evaluate_deepdive_session", {
      body,
    })
    return NextResponse.json(result)
  } catch (e: any) {
    console.error("Proxy deepdive-transcript POST failed:", e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}


