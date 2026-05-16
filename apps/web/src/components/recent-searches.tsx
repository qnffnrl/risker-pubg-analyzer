'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import {
  getRecentSearches,
  removeRecentSearch,
  addFavorite,
  removeFavorite,
  isFavorite,
  type RecentSearch,
} from '@/lib/storage'
import { PlayerHistoryCard } from './player-history-card'

export function RecentSearches() {
  const [items, setItems] = useState<RecentSearch[]>([])

  useEffect(() => {
    setItems(getRecentSearches())
  }, [])

  if (items.length === 0) return null

  function handleRemove(pubgId: string) {
    removeRecentSearch(pubgId)
    setItems(getRecentSearches())
  }

  function handleToggleFav(item: RecentSearch) {
    if (isFavorite(item.pubgId)) {
      removeFavorite(item.pubgId)
    } else {
      addFavorite({ nickname: item.nickname, platform: item.platform, pubgId: item.pubgId })
    }
    setItems(getRecentSearches())
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">최근 검색</h2>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <PlayerHistoryCard
            key={item.pubgId}
            {...item}
            timestamp={item.searchedAt}
            isFav={isFavorite(item.pubgId)}
            onRemove={() => handleRemove(item.pubgId)}
            onToggleFav={() => handleToggleFav(item)}
          />
        ))}
      </div>
    </section>
  )
}
