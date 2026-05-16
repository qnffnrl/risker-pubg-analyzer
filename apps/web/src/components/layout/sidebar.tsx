'use client'

import Link from 'next/link'
import { Clock, Star } from 'lucide-react'
import { useRecentSearches } from '@/lib/hooks/use-recent-searches'
import { useFavorites } from '@/lib/hooks/use-favorites'
import { PlayerAvatar } from '@/components/ui/player-avatar'

const PLATFORM_LABEL: Record<string, string> = {
  steam: 'Steam',
  kakao: 'Kakao',
  console: 'Console',
  psn: 'PSN',
  xbox: 'Xbox',
  stadia: 'Stadia',
}

export function Sidebar() {
  const { searches } = useRecentSearches()
  const { favorites } = useFavorites()

  const recentList = searches.slice(0, 5)
  const favoriteList = favorites.slice(0, 5)

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/50 bg-background/50 xl:flex xl:flex-col">
      <div className="flex flex-col gap-6 p-4">
        {/* 최근 검색 */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" />
            최근 검색
          </div>
          <div className="space-y-1">
            {recentList.length === 0 ? (
              <div className="rounded-lg px-3 py-2 text-xs text-muted-foreground">
                — 검색 기록 없음 —
              </div>
            ) : (
              recentList.map((item) => (
                <Link
                  key={item.pubgId}
                  href={`/players/${item.pubgId}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                >
                  <PlayerAvatar nickname={item.nickname} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">
                      {item.nickname}
                    </div>
                    <div className="truncate text-muted-foreground">
                      {PLATFORM_LABEL[item.platform] ?? item.platform}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* 즐겨찾기 */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Star className="h-3 w-3" />
            즐겨찾기
          </div>
          <div className="space-y-1">
            {favoriteList.length === 0 ? (
              <div className="rounded-lg px-3 py-2 text-xs text-muted-foreground">
                — 즐겨찾기 없음 —
              </div>
            ) : (
              favoriteList.map((item) => (
                <Link
                  key={item.pubgId}
                  href={`/players/${item.pubgId}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                >
                  <PlayerAvatar nickname={item.nickname} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">
                      {item.nickname}
                    </div>
                    <div className="truncate text-muted-foreground">
                      {PLATFORM_LABEL[item.platform] ?? item.platform}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
