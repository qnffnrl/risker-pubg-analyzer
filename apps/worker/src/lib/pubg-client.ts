import pLimit from 'p-limit'
import { ZodError, ZodSchema } from 'zod'
import type { Shard } from '@risker/shared'
import {
  PUBG_API_BASE,
  PubgPlayersResponseSchema,
  PubgPlayerResponseSchema,
  PubgMatchResponseSchema,
  PubgSeasonsResponseSchema,
  PubgSeasonStatsResponseSchema,
  PubgWeaponMasteryResponseSchema,
  PubgRankedStatsResponseSchema,
  type PubgPlayerData,
  type PubgMatchResponse,
  type PubgSeason,
  type PubgSeasonStats,
  type PubgWeaponMastery,
  type PubgRankedStats,
} from '@risker/shared'
import {
  PlayerNotFoundError,
  RateLimitError,
  PubgServerError,
  PubgResponseParseError,
} from './errors.js'

const MAX_CONCURRENCY = 3
const MIN_INTERVAL_MS = 100
const MAX_RETRIES = 3

export class PubgApiClient {
  private readonly apiKey: string
  private readonly limit = pLimit(MAX_CONCURRENCY)
  private lastRequestAt = 0

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env['PUBG_API_KEY']
    if (!key) throw new Error('PUBG_API_KEY environment variable is required')
    this.apiKey = key
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async getPlayerByName(shard: Shard, name: string): Promise<PubgPlayerData> {
    const data = await this.request(
      `/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`,
      PubgPlayersResponseSchema,
    )
    const player = data.data[0]
    if (!player) throw new PlayerNotFoundError(name, shard)
    return player
  }

  async getPlayerById(shard: Shard, accountId: string): Promise<PubgPlayerData> {
    const data = await this.request(
      `/shards/${shard}/players/${accountId}`,
      PubgPlayerResponseSchema,
    )
    return data.data
  }

  async getMatch(shard: Shard, matchId: string): Promise<PubgMatchResponse> {
    return this.request(`/shards/${shard}/matches/${matchId}`, PubgMatchResponseSchema)
  }

  async getSeasons(shard: Shard): Promise<PubgSeason[]> {
    const data = await this.request(`/shards/${shard}/seasons`, PubgSeasonsResponseSchema)
    return data.data
  }

  async getPlayerSeasonStats(
    shard: Shard,
    accountId: string,
    seasonId: string,
  ): Promise<PubgSeasonStats> {
    const data = await this.request(
      `/shards/${shard}/players/${accountId}/seasons/${seasonId}`,
      PubgSeasonStatsResponseSchema,
    )
    return data.data
  }

  async getRankedStats(shard: Shard, accountId: string, seasonId: string): Promise<PubgRankedStats> {
    const data = await this.request(
      `/shards/${shard}/players/${accountId}/seasons/${seasonId}/ranked`,
      PubgRankedStatsResponseSchema,
    )
    return data.data
  }

  async getWeaponMastery(shard: Shard, accountId: string): Promise<PubgWeaponMastery> {
    const data = await this.request(
      `/shards/${shard}/players/${accountId}/weapon_mastery`,
      PubgWeaponMasteryResponseSchema,
    )
    return data.data
  }

  /** Returns match IDs from the player's relationships (most recent first) */
  async getRecentMatchIds(shard: Shard, accountId: string, limit = 20): Promise<string[]> {
    const player = await this.getPlayerById(shard, accountId)
    return player.relationships.matches.data.slice(0, limit).map((m) => m.id)
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private async request<T>(path: string, schema: ZodSchema<T>): Promise<T> {
    return this.limit(() => this.fetchWithRetry(path, schema))
  }

  private async fetchWithRetry<T>(
    path: string,
    schema: ZodSchema<T>,
    attempt = 1,
  ): Promise<T> {
    await this.throttle()

    const url = `${PUBG_API_BASE}${path}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.api+json',
      },
    })

    if (res.status === 404) throw new PlayerNotFoundError(path, 'unknown')
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? 60)
      if (attempt > MAX_RETRIES) throw new RateLimitError(retryAfter)
      await sleep(retryAfter * 1000 * Math.pow(2, attempt - 1))
      return this.fetchWithRetry(path, schema, attempt + 1)
    }
    if (res.status >= 500) {
      if (attempt > MAX_RETRIES) throw new PubgServerError(res.status, await res.text())
      await sleep(1000 * Math.pow(2, attempt - 1))
      return this.fetchWithRetry(path, schema, attempt + 1)
    }
    if (!res.ok) throw new PubgServerError(res.status, await res.text())

    const json: unknown = await res.json()
    try {
      return schema.parse(json)
    } catch (err) {
      if (err instanceof ZodError) {
        throw new PubgResponseParseError(path, json, err)
      }
      throw err
    }
  }

  private async throttle(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestAt
    if (elapsed < MIN_INTERVAL_MS) {
      await sleep(MIN_INTERVAL_MS - elapsed)
    }
    this.lastRequestAt = Date.now()
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
