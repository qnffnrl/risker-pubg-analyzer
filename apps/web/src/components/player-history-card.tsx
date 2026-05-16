'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Star, Loader2 } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { PlatformBadge } from '@/components/ui/platform-badge'
import { searchPlayer } from '@/lib/api-client'
import { addRecentSearch } from '@/lib/storage'
import type { Platform } from '@/lib/storage'

interface PlayerHistoryCardProps {
  nickname: string
  platform: Platform
  pubgId: string
  timestamp: string
  isFav?: boolean
  onRemove: () => void
  onToggleFav?: () => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}

export function PlayerHistoryCard({
  nickname,
  platform,
  pubgId,
  timestamp,
  isFav = false,
  onRemove,
  onToggleFav,
}: PlayerHistoryCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const res = await searchPlayer(nickname, platform)
      const targetPubgId = res.player?.pubgId ?? res.pubgId ?? pubgId
      addRecentSearch({ nickname: res.player?.nickname ?? nickname, platform, pubgId: targetPubgId })
      router.push(`/players/${targetPubgId}`)
    } catch {
      // 검색 실패 시 기존 pubgId로 이동 (최후 수단)
      router.push(`/players/${pubgId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-card/80">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex flex-1 items-center gap-3 min-w-0 text-left disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-8 w-8 shrink-0 animate-spin text-primary" />
        ) : (
          <PlayerAvatar nickname={nickname} size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{nickname}</span>
            <PlatformBadge platform={platform} />
          </div>
          <span className="text-xs text-muted-foreground">
            {loading ? '검색 중...' : timeAgo(timestamp)}
          </span>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onToggleFav && (
          <button
            onClick={onToggleFav}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-amber-400 transition-colors"
            aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        )}
        <button
          onClick={onRemove}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="삭제"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
