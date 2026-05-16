export type Platform = 'steam' | 'kakao' | 'psn' | 'xbox'

export interface RecentSearch {
  nickname: string
  platform: Platform
  pubgId: string
  searchedAt: string
  avatarColor: string
}

export interface Favorite {
  nickname: string
  platform: Platform
  pubgId: string
  addedAt: string
  avatarColor: string
}

const RECENT_KEY = 'risker:recent-searches'
const FAVORITES_KEY = 'risker:favorites'
const MAX_RECENT = 10
const MAX_FAVORITES = 20

const AVATAR_COLORS = [
  '#00d4aa', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#10b981', '#f97316', '#06b6d4',
]

export function getAvatarColor(nickname: string): string {
  const hash = nickname.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

function safeRead<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function safeWrite<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // storage full — silently ignore
  }
}

export function getRecentSearches(): RecentSearch[] {
  return safeRead<RecentSearch>(RECENT_KEY)
}

export function addRecentSearch(entry: Omit<RecentSearch, 'searchedAt' | 'avatarColor'>): void {
  const items = getRecentSearches().filter((r) => r.pubgId !== entry.pubgId)
  items.unshift({ ...entry, searchedAt: new Date().toISOString(), avatarColor: getAvatarColor(entry.nickname) })
  safeWrite(RECENT_KEY, items.slice(0, MAX_RECENT))
}

export function removeRecentSearch(pubgId: string): void {
  safeWrite(RECENT_KEY, getRecentSearches().filter((r) => r.pubgId !== pubgId))
}

export function clearRecentSearches(): void {
  safeWrite(RECENT_KEY, [])
}

export function getFavorites(): Favorite[] {
  return safeRead<Favorite>(FAVORITES_KEY)
}

export function addFavorite(entry: Omit<Favorite, 'addedAt' | 'avatarColor'>): void {
  const items = getFavorites().filter((f) => f.pubgId !== entry.pubgId)
  items.unshift({ ...entry, addedAt: new Date().toISOString(), avatarColor: getAvatarColor(entry.nickname) })
  safeWrite(FAVORITES_KEY, items.slice(0, MAX_FAVORITES))
}

export function removeFavorite(pubgId: string): void {
  safeWrite(FAVORITES_KEY, getFavorites().filter((f) => f.pubgId !== pubgId))
}

export function isFavorite(pubgId: string): boolean {
  return getFavorites().some((f) => f.pubgId === pubgId)
}

export { RECENT_KEY, FAVORITES_KEY }
