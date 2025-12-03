import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api"

export async function GET() {
  try {
    const result = await apiClient.get("/problems/get_problems")
    return NextResponse.json(result)
  } catch (e: any) {
    console.error("Proxy problems/get failed:", e)
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 })
  }
}




