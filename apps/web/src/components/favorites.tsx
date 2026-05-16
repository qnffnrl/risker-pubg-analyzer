'use client'

import { Star } from 'lucide-react'
import { useFavorites } from '@/lib/hooks/use-favorites'
import { PlayerHistoryCard } from './player-history-card'

export function Favorites() {
  const { favorites, removeFavorite } = useFavorites()

  if (favorites.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-muted-foreground">즐겨찾기</h2>
      </div>
      <div className="flex flex-col gap-2">
        {favorites.map((item) => (
          <PlayerHistoryCard
            key={item.pubgId}
            {...item}
            timestamp={item.addedAt}
            isFav
            onRemove={() => removeFavorite(item.pubgId)}
          />
        ))}
      </div>
    </section>
  )
}
