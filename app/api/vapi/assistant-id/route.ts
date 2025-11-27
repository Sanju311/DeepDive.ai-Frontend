import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") || "").toLowerCase()

    let id: string | undefined
    if (type === "clarification") {
      id = process.env.VAPI_CLARIFICATION_ASSISTANT_ID
    } else if (type === "deep-dive")  {
      id = process.env.VAPI_DEEPDIVE_ASSISTANT_ID
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    if (!id) {
      return NextResponse.json({ error: `Assistant id not configured for type: ${type}` }, { status: 404 })
    }

    return NextResponse.json({ id })
  } catch (err) {
    return NextResponse.json({ error: "Failed to resolve assistant id" }, { status: 500 })
  }
}


