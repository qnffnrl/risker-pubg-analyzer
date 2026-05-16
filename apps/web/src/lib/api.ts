// API_URL: 서버사이드 전용 (Docker 내부 네트워크), NEXT_PUBLIC_API_URL: 클라이언트 빌드타임
const API_BASE = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8081'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const json = (await res.json()) as { success: boolean; data?: T; error?: { code: string; message: string } }
  if (!json.success || json.data === undefined) {
    throw Object.assign(new Error(json.error?.message ?? 'API error'), { code: json.error?.code })
  }
  return json.data
}

export interface PlayerData {
  id: string
  pubgId: string
  nickname: string
  platform: 'steam' | 'kakao' | 'psn' | 'xbox'
  region: string | null
  lastFetchedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AnalysisData {
  id: string
  playerId: string
  analyzedAt: string
  matchCount: number
  aggressionScore: string
  survivalScore: string
  positioningScore: string
  teamplayScore: string
  aggressionMetrics: Record<string, number>
  survivalMetrics: Record<string, number>
  positioningMetrics: Record<string, number>
  teamplayMetrics: Record<string, number>
  llmSummary: string | null
  expiresAt: string
}

export interface MatchStat {
  matchId: string
  mapName: string | null
  mode: string | null
  playedAt: string | null
  durationSec: number | null
  totalPlayers: number | null
  placement: number | null
  kills: number | null
  assists: number | null
  damageDealt: string | null
  headshotKills: number | null
  distanceOnFoot: string | null
  distanceInVehicle: string | null
  timeSurvived: number | null
  boosts: number | null
  heals: number | null
  weaponsAcquired: number | null
  revives: number | null
}

export interface PlayerProfile {
  player: PlayerData
  latestAnalysis: AnalysisData | null
}

export interface MatchesResponse {
  matches: MatchStat[]
  limit: number
  offset: number
}

export async function getPlayer(pubgId: string): Promise<PlayerProfile> {
  return apiFetch<PlayerProfile>(`/api/v1/players/${encodeURIComponent(pubgId)}`)
}

export async function getPlayerMatches(pubgId: string, limit = 20, offset = 0): Promise<MatchesResponse> {
  return apiFetch<MatchesResponse>(`/api/v1/players/${encodeURIComponent(pubgId)}/matches?limit=${limit}&offset=${offset}`)
}

export async function getPlayerAnalysis(pubgId: string): Promise<AnalysisData> {
  return apiFetch<AnalysisData>(`/api/v1/players/${encodeURIComponent(pubgId)}/analysis`)
}
