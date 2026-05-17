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

export interface CompareResult {
  players: Array<{ player: PlayerData; analysis: AnalysisData | null }>
}

export interface WeaponSummaryData {
  XPTotal: number
  LevelCurrent: number
  TierCurrent: number
  StatsTotal: {
    Kills: number
    DamagePlayer: number
    HeadShots: number
    Groggies: number
    Assists: number
    LongestKill: number
    LongestDefeat: number
    LongRangeDefeats: number
    Defeats: number
    Shots?: number
    Hits?: number
  }
}

export interface WeaponStatsData {
  weaponData: Record<string, WeaponSummaryData>
  fetchedAt: string
}

export async function getWeaponStats(pubgId: string): Promise<WeaponStatsData> {
  return apiFetch<WeaponStatsData>(`/api/v1/players/${encodeURIComponent(pubgId)}/weapons`)
}

export interface MapStat {
  mapName: string
  games: number
  wins: number
  winRate: number
  avgKills: number
  avgDamage: number
  avgPlacement: number
  avgFootDistance: number
  avgVehicleDistance: number
}

export interface MapStatsData {
  mapStats: MapStat[]
  totalGames: number
}

export async function getMapStats(pubgId: string): Promise<MapStatsData> {
  return apiFetch<MapStatsData>(`/api/v1/players/${encodeURIComponent(pubgId)}/maps`)
}

export interface RankedTier {
  tier: string
  subTier: string
}

export interface RankedModeStats {
  currentTier: RankedTier
  currentRankPoint: number
  bestTier: RankedTier
  bestRankPoint: number
  roundsPlayed: number
  wins: number
  winRatio: number
  kills: number
  assists?: number
  deaths?: number
  kda: number
  damageDealt: number
  avgRank: number
  top10Ratio?: number
  headshotKills?: number
  headshotKillRatio?: number
  dBNOs?: number
  revives?: number
  roundMostKills?: number
  longestKill?: number
}

export interface RankedStatsData {
  rankedData: Record<string, RankedModeStats>
  seasonId: string
  fetchedAt: string
}

export async function getRankedStats(pubgId: string): Promise<RankedStatsData> {
  return apiFetch<RankedStatsData>(`/api/v1/players/${encodeURIComponent(pubgId)}/ranked`)
}

export async function getCompare(pubgIdA: string, pubgIdB: string): Promise<CompareResult> {
  return apiFetch<CompareResult>(
    `/api/v1/compare?players=${encodeURIComponent(pubgIdA)},${encodeURIComponent(pubgIdB)}`,
  )
}

export interface ParticipantStats {
  DBNOs: number
  assists: number
  boosts: number
  damageDealt: number
  deathType: string
  headshotKills: number
  heals: number
  killPlace: number
  kills: number
  longestKill: number
  name: string
  playerId: string
  revives: number
  rideDistance: number
  roadKills: number
  swimDistance: number
  teamKills: number
  timeSurvived: number
  vehicleDestroys: number
  walkDistance: number
  weaponsAcquired: number
  winPlace: number
}

export interface MatchParticipant {
  id: string
  stats: ParticipantStats
}

export interface MatchRoster {
  id: string
  rank: number
  teamId: number
  won: boolean
  participantIds: string[]
}

export interface MatchDetailData {
  match: {
    pubgMatchId: string
    mapName: string | null
    mode: string | null
    playedAt: string | null
    durationSec: number | null
    totalPlayers: number | null
  }
  participants: MatchParticipant[]
  rosters: MatchRoster[]
  telemetryUrl: string | null
  dataUnavailable?: boolean
}

export async function getMatchDetail(matchId: string): Promise<MatchDetailData> {
  return apiFetch<MatchDetailData>(`/api/v1/matches/${encodeURIComponent(matchId)}`)
}
