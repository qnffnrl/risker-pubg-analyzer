const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8081'

export type Platform = 'steam' | 'kakao' | 'psn' | 'xbox'

export interface SearchResponse {
  jobId: string | null
  playerId: string | null
  cached: boolean
  player?: {
    id: string
    pubgId: string
    nickname: string
    platform: Platform
  }
  analysis?: Record<string, unknown>
}

export interface JobStatus {
  jobId: string
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown'
  progress: number
  result?: Record<string, unknown>
  error?: string
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const json = (await res.json()) as { success: boolean; data?: T; error?: { code: string; message: string } }
  if (!json.success || !json.data) {
    const msg = json.error?.message ?? 'API error'
    const code = json.error?.code ?? 'UNKNOWN'
    throw Object.assign(new Error(msg), { code })
  }
  return json.data
}

export async function searchPlayer(nickname: string, platform: Platform): Promise<SearchResponse> {
  return apiFetch<SearchResponse>('/api/v1/players/search', {
    method: 'POST',
    body: JSON.stringify({ nickname, platform }),
  })
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/api/v1/jobs/${encodeURIComponent(jobId)}/status`)
}

export function pollJobUntilDone(
  jobId: string,
  onProgress: (pct: number) => void,
  intervalMs = 500,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId)
        onProgress(status.progress)
        if (status.status === 'completed') {
          clearInterval(timer)
          resolve()
        } else if (status.status === 'failed') {
          clearInterval(timer)
          reject(new Error(status.error ?? 'Job failed'))
        }
      } catch (err) {
        clearInterval(timer)
        reject(err)
      }
    }, intervalMs)
  })
}
