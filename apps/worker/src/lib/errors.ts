export class PlayerNotFoundError extends Error {
  constructor(name: string, shard: string) {
    super(`Player "${name}" not found on shard "${shard}"`)
    this.name = 'PlayerNotFoundError'
  }
}

export class RateLimitError extends Error {
  constructor(public readonly retryAfter: number) {
    super(`PUBG API rate limit exceeded. Retry after ${retryAfter}s`)
    this.name = 'RateLimitError'
  }
}

export class PubgServerError extends Error {
  constructor(public readonly status: number, message: string) {
    super(`PUBG API server error ${status}: ${message}`)
    this.name = 'PubgServerError'
  }
}

export class PubgResponseParseError extends Error {
  constructor(
    endpoint: string,
    public readonly raw: unknown,
    cause: Error,
  ) {
    super(`Failed to parse PUBG API response from ${endpoint}: ${cause.message}`)
    this.name = 'PubgResponseParseError'
    this.cause = cause
  }
}
