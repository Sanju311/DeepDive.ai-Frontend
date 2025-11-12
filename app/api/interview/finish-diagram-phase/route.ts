import { apiClient } from "@/lib/api"

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const body = await request.json()
    const params = Object.fromEntries(url.searchParams.entries())

    const data = await apiClient.post("/interview/finish_diagram_phase", {
      params,
      body,
    })

    return Response.json(data)
  } catch (error) {
    console.error("Failed to finish diagram phase from frontend:", error)
    return Response.json(
      { error: "Failed to finish diagram phase" },
      { status: 500 }
    )
  }
}