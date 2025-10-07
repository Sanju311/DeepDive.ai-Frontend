const BASE_URL = process.env.BACKEND_URL!
const API_KEY = process.env.BACKEND_API_KEY!

type ApiOptions = {
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
  auth?: boolean
  method?: string
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return ""
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.append(key, String(value))
    }
  }
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

export async function apiFetch<T>(
  endpoint: string,
  { params, body, headers = {}, auth = true, method = "GET" }: ApiOptions = {}
): Promise<T> {

  const url = `${BASE_URL}${endpoint}${buildQuery(params)}`
  console.log("url", url)
  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(auth && { Authorization: `Bearer ${API_KEY}` }),
    ...headers,
  }

  const res = await fetch(url, {
    method,
    headers: mergedHeaders,
    cache: "no-store",
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[API ERROR] ${res.status} ${endpoint}: ${text}`)
    throw new Error(`Backend request failed: ${res.status}`)
  }

  try {
    return (await res.json()) as T
  } catch {
    return {} as T
  }
}

export const apiClient = {
  get: async <T>(path: string, options: Omit<ApiOptions, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: async <T>(path: string, options: Omit<ApiOptions, "method"> = {}) =>
    apiFetch<T>(path, { ...options, method: "POST" }),
  put: async <T>(path: string, options: Omit<ApiOptions, "method"> = {}) =>
    apiFetch<T>(path, { ...options, method: "PUT" }),
  del: async <T>(path: string, options: Omit<ApiOptions, "method"> = {}) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
}
