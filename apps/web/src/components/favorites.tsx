'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { getFavorites, removeFavorite, type Favorite } from '@/lib/storage'
import { PlayerHistoryCard } from './player-history-card'

export function Favorites() {
  const [items, setItems] = useState<Favorite[]>([])

  useEffect(() => {
    setItems(getFavorites())
  }, [])

  if (items.length === 0) return null

  function handleRemove(pubgId: string) {
    removeFavorite(pubgId)
    setItems(getFavorites())
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-muted-foreground">즐겨찾기</h2>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <PlayerHistoryCard
            key={item.pubgId}
            {...item}
            timestamp={item.addedAt}
            isFav
            onRemove={() => handleRemove(item.pubgId)}
          />
        ))}
      </div>
    </section>
  )
}
