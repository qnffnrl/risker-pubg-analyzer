'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  FAVORITES_KEY,
  type Favorite,
} from '@/lib/storage'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([])

  const sync = useCallback(() => setFavorites(getFavorites()), [])

  useEffect(() => {
    sync()
    const handler = (e: StorageEvent) => { if (e.key === FAVORITES_KEY) sync() }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [sync])

  const add = useCallback((entry: Omit<Favorite, 'addedAt' | 'avatarColor'>) => {
    addFavorite(entry)
    sync()
  }, [sync])

  const remove = useCallback((pubgId: string) => {
    removeFavorite(pubgId)
    sync()
  }, [sync])

  const checkFav = useCallback((pubgId: string) => isFavorite(pubgId), [])

  const toggle = useCallback((entry: Omit<Favorite, 'addedAt' | 'avatarColor'>) => {
    if (isFavorite(entry.pubgId)) removeFavorite(entry.pubgId)
    else addFavorite(entry)
    sync()
  }, [sync])

  return { favorites, addFavorite: add, removeFavorite: remove, isFavorite: checkFav, toggleFavorite: toggle }
}
