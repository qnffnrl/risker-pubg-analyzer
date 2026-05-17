'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, RefreshCw, GitCompareArrows, Link2, Download } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { PlatformBadge } from '@/components/ui/platform-badge'
import { useFavorites } from '@/lib/hooks/use-favorites'
import type { PlayerData, AnalysisData } from '@/lib/api'

interface PlayerHeaderProps {
  player: PlayerData
  analysis: AnalysisData | null
}

export function PlayerHeader({ player, analysis }: PlayerHeaderProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites()

  const fav = isFavorite(player.pubgId)

  function toggleFav() {
    toggleFavorite({ nickname: player.nickname, platform: player.platform, pubgId: player.pubgId })
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing
    }
  }

  async function handleDownloadImage() {
    const url = `/og?pubgId=${encodeURIComponent(player.pubgId)}`
    try {
      const res = await fetch(url)
      const svgText = await res.text()

      // SVG → PNG via browser Canvas
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 630
      const ctx = canvas.getContext('2d')!

      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => { ctx.drawImage(img, 0, 0); resolve() }
        img.onerror = reject
        img.src = svgUrl
      })
      URL.revokeObjectURL(svgUrl)

      canvas.toBlob((blob) => {
        if (!blob) {
          setRefreshError('이미지 저장에 실패했습니다.')
          setTimeout(() => setRefreshError(null), 3000)
          return
        }
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `${player.nickname}-pubg-analysis.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
      }, 'image/png')
    } catch {
      setRefreshError('이미지 저장에 실패했습니다.')
      setTimeout(() => setRefreshError(null), 3000)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshError(null)
    const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8081'
    try {
      const res = await fetch(`${apiBase}/api/v1/players/${encodeURIComponent(player.pubgId)}/refresh`, { method: 'POST' })
      const json = await res.json() as { data?: { jobId?: string } }
      const jobId = json.data?.jobId
      if (!jobId) {
        setRefreshError('새로고침 요청에 실패했습니다.')
        setRefreshing(false)
        return
      }

      const deadline = Date.now() + 30_000
      while (Date.now() < deadline) {
        await new Promise<void>((resolve) => setTimeout(resolve, 2000))
        try {
          const statusRes = await fetch(`${apiBase}/api/v1/jobs/${jobId}/status`)
          const statusJson = await statusRes.json() as { data?: { status?: string } }
          const status = statusJson.data?.status
          if (status === 'completed') {
            window.location.reload()
            return
          }
          if (status === 'failed') {
            setRefreshError('데이터 수집에 실패했습니다. 잠시 후 다시 시도해 주세요.')
            setRefreshing(false)
            return
          }
        } catch {
          // 네트워크 오류 시 재시도 계속
        }
      }

      setRefreshError('새로고침 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')
      setRefreshing(false)
    } catch {
      setRefreshError('새로고침 요청에 실패했습니다.')
      setRefreshing(false)
    }
  }

  const analyzedAt = analysis?.analyzedAt
    ? new Date(analysis.analyzedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
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
          <div className="relative">
            <button
              onClick={handleCopyLink}
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              aria-label="링크 복사"
            >
              <Link2 className="h-4 w-4" />
            </button>
            {copied && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-primary whitespace-nowrap">복사됨!</span>
            )}
          </div>
          <button
            onClick={handleDownloadImage}
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="이미지 저장"
          >
            <Download className="h-4 w-4" />
          </button>
          <Link
            href={`/compare?a=${encodeURIComponent(player.pubgId)}`}
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="비교하기"
          >
            <GitCompareArrows className="h-4 w-4" />
          </Link>
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
      {refreshError && (
        <p className="mt-2 text-xs text-destructive">{refreshError}</p>
      )}
    </div>
  )
}
