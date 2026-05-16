// Common utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type MaybePromise<T> = T | Promise<T>

// Pagination
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}
