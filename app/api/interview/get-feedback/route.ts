import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const session_id = searchParams.get("session_id")
    if (!session_id) {
      return NextResponse.json({ error: "missing session_id" }, { status: 400 })
    }
    const result = await apiClient.get("/interview/get_interview_feedback", {
      params: { session_id },
    })
    return NextResponse.json(result)
  } catch (e: any) {
    console.error("Proxy get-feedback failed:", e)
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 })
  }
}


