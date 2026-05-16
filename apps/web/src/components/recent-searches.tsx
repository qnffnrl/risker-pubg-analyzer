'use client'

import { Clock } from 'lucide-react'
import { useRecentSearches } from '@/lib/hooks/use-recent-searches'
import { useFavorites } from '@/lib/hooks/use-favorites'
import { PlayerHistoryCard } from './player-history-card'

export function RecentSearches() {
  const { searches, removeSearch } = useRecentSearches()
  const { isFavorite, toggleFavorite } = useFavorites()

  if (searches.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">최근 검색</h2>
      </div>
      <div className="flex flex-col gap-2">
        {searches.map((item) => (
          <PlayerHistoryCard
            key={item.pubgId}
            {...item}
            timestamp={item.searchedAt}
            isFav={isFavorite(item.pubgId)}
            onRemove={() => removeSearch(item.pubgId)}
            onToggleFav={() => toggleFavorite({ nickname: item.nickname, platform: item.platform, pubgId: item.pubgId })}
          />
        ))}
      </div>
    </section>
  )
}
