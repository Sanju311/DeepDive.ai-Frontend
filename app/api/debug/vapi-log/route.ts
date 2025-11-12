import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "vapi-webhook.ndjson")

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...body,
    })
    await fs.mkdir(LOG_DIR, { recursive: true })
    await fs.appendFile(LOG_FILE, line + "\n", "utf8")
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Best effort logging endpoint; never throw
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 200 })
  }
}


