'use client'

import { useState, useEffect } from 'react'
import { Star, RefreshCw } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { PlatformBadge } from '@/components/ui/platform-badge'
import { addFavorite, removeFavorite, isFavorite } from '@/lib/storage'
import type { PlayerData, AnalysisData } from '@/lib/api'

interface PlayerHeaderProps {
  player: PlayerData
  analysis: AnalysisData | null
}

export function PlayerHeader({ player, analysis }: PlayerHeaderProps) {
  const [fav, setFav] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setFav(isFavorite(player.pubgId))
  }, [player.pubgId])

  function toggleFav() {
    if (fav) {
      removeFavorite(player.pubgId)
    } else {
      addFavorite({ nickname: player.nickname, platform: player.platform, pubgId: player.pubgId })
    }
    setFav(!fav)
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8081'
      await fetch(`${apiBase}/api/v1/players/${encodeURIComponent(player.pubgId)}/refresh`, { method: 'POST' })
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setRefreshing(false)
    }
  }

  const analyzedAt = analysis?.analyzedAt
    ? new Date(analysis.analyzedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
      <PlayerAvatar nickname={player.nickname} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">{player.nickname}</h1>
          <PlatformBadge platform={player.platform} />
        </div>
        {analyzedAt && (
          <p className="mt-1 text-xs text-muted-foreground">마지막 분석: {analyzedAt}</p>
        )}
        {analysis && (
          <p className="text-xs text-muted-foreground">{analysis.matchCount}게임 분석</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={toggleFav}
          className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-amber-400/50 hover:text-amber-400"
          aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Star className={`h-4 w-4 ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
          aria-label="새로고침"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}
