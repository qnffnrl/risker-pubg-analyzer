'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  RECENT_KEY,
  type RecentSearch,
} from '@/lib/storage'

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([])

  const sync = useCallback(() => setSearches(getRecentSearches()), [])

  useEffect(() => {
    sync()
    const handler = (e: StorageEvent) => { if (e.key === RECENT_KEY) sync() }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [sync])

  const add = useCallback((entry: Omit<RecentSearch, 'searchedAt' | 'avatarColor'>) => {
    addRecentSearch(entry)
    sync()
  }, [sync])

  const remove = useCallback((pubgId: string) => {
    removeRecentSearch(pubgId)
    sync()
  }, [sync])

  const clear = useCallback(() => {
    clearRecentSearches()
    sync()
  }, [sync])

  return { searches, addSearch: add, removeSearch: remove, clearAll: clear }
}
