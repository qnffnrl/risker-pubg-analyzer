'use client'

import { useState, useEffect } from 'react'
import { MatchCard } from '@/components/match-card'
import { getPlayerMatches, type MatchStat } from '@/lib/api'

const MODES = ['전체', 'squad', 'duo', 'solo'] as const
type ModeFilter = (typeof MODES)[number]

interface MatchListProps {
  initialMatches: MatchStat[]
  pubgId: string
}

export function MatchList({ initialMatches, pubgId }: MatchListProps) {
  const [matches, setMatches] = useState(initialMatches)
  const [modeFilter, setModeFilter] = useState<ModeFilter>('전체')
  const [offset, setOffset] = useState(initialMatches.length)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialMatches.length >= 20)

  // router.refresh() 시 서버에서 새 initialMatches가 오면 state 동기화
  useEffect(() => {
    setMatches(initialMatches)
    setOffset(initialMatches.length)
    setHasMore(initialMatches.length >= 20)
  }, [initialMatches.length])

  const filtered = modeFilter === '전체'
    ? matches
    : matches.filter((m) => m.mode?.startsWith(modeFilter))

  async function loadMore() {
    setLoading(true)
    try {
      const res = await getPlayerMatches(pubgId, 20, offset)
      setMatches((prev) => [...prev, ...res.matches])
      setOffset((prev) => prev + res.matches.length)
      if (res.matches.length < 20) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* 모드 필터 */}
      <div className="mb-4 flex items-center gap-2">
        <h2 className="mr-2 text-sm font-semibold text-foreground">최근 매치</h2>
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setModeFilter(mode)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              modeFilter === mode
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {mode === '전체' ? '전체' : mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 매치 카드 목록 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">매치 데이터가 없습니다.</p>
        ) : (
          filtered.map((m) => <MatchCard key={m.matchId} match={m} />)
        )}
      </div>

      {/* 더보기 */}
      {hasMore && modeFilter === '전체' && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-4 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          {loading ? '로딩 중...' : '더보기'}
        </button>
      )}
    </div>
  )
}
