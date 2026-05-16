'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Star, Loader2 } from 'lucide-react'
import { useRecentSearches } from '@/lib/hooks/use-recent-searches'
import { useFavorites } from '@/lib/hooks/use-favorites'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { searchPlayer } from '@/lib/api-client'
import { addRecentSearch, addFavorite } from '@/lib/storage'
import type { Platform } from '@/lib/storage'

const PLATFORM_LABEL: Record<string, string> = {
  steam: 'Steam',
  kakao: 'Kakao',
  console: 'Console',
  psn: 'PSN',
  xbox: 'Xbox',
  stadia: 'Stadia',
}

function SidebarItem({
  nickname,
  platform,
  pubgId,
  type,
}: {
  nickname: string
  platform: Platform
  pubgId: string
  type: 'recent' | 'favorite'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const res = await searchPlayer(nickname, platform)
      const targetPubgId = res.player?.pubgId ?? res.pubgId ?? pubgId
      const targetNickname = res.player?.nickname ?? nickname
      if (type === 'recent') {
        addRecentSearch({ nickname: targetNickname, platform, pubgId: targetPubgId })
      } else {
        addFavorite({ nickname: targetNickname, platform, pubgId: targetPubgId })
      }
      router.push(`/players/${targetPubgId}`)
    } catch {
      router.push(`/players/${pubgId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-6 w-6 shrink-0 animate-spin text-primary" />
      ) : (
        <PlayerAvatar nickname={nickname} size="sm" />
      )}
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate font-medium text-foreground">{nickname}</div>
        <div className="truncate text-muted-foreground">
          {loading ? '검색 중...' : (PLATFORM_LABEL[platform] ?? platform)}
        </div>
      </div>
    </button>
  )
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
                <SidebarItem
                  key={item.pubgId}
                  nickname={item.nickname}
                  platform={item.platform}
                  pubgId={item.pubgId}
                  type="recent"
                />
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
                <SidebarItem
                  key={item.pubgId}
                  nickname={item.nickname}
                  platform={item.platform}
                  pubgId={item.pubgId}
                  type="favorite"
                />
              ))
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
