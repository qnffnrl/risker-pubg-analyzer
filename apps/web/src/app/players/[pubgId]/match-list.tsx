'use client'

import { useState, useEffect } from 'react'
import { MatchCard } from '@/components/match-card'
import { getPlayerMatches, type MatchStat } from '@/lib/api'

interface MatchListProps {
  initialMatches: MatchStat[]
  pubgId: string
  onLoadMore?: (newMatches: MatchStat[]) => void
  totalLoaded?: number
}

export function MatchList({ initialMatches, pubgId, onLoadMore, totalLoaded }: MatchListProps) {
  const [extraMatches, setExtraMatches] = useState<MatchStat[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // When initialMatches changes (filter applied), reset extra
  useEffect(() => {
    setExtraMatches([])
  }, [initialMatches])

  const displayed = [...initialMatches, ...extraMatches]

  async function loadMore() {
    setLoading(true)
    try {
      // Use totalLoaded (all unfiltered matches count) as offset for accurate pagination
      const offset = totalLoaded ?? initialMatches.length + extraMatches.length
      const res = await getPlayerMatches(pubgId, 20, offset)
      if (res.matches.length === 0) {
        setHasMore(false)
      } else {
        setExtraMatches((prev) => [...prev, ...res.matches])
        onLoadMore?.(res.matches)
        if (res.matches.length < 20) setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">매치 데이터가 없습니다.</p>
        ) : (
          displayed.map((m) => <MatchCard key={m.matchId} match={m} pubgId={pubgId} />)
        )}
      </div>
      {hasMore && (
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
