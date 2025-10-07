import { apiClient } from "@/lib/api"

export async function POST() {
  try {
    // Call backend to start interview
    const data = await apiClient.post("/interview/start_interview")
    
    return Response.json(data)
  } catch (error) {
    console.error("Failed to start interview from frontend:", error)
    return Response.json(
      { error: "Failed to start interview" },
      { status: 500 }
    )
  }
}