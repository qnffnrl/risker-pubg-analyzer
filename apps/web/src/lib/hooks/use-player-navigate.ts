'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { searchPlayer, pollJobUntilDone } from '@/lib/api-client'
import { addRecentSearch } from '@/lib/storage'
import type { Platform } from '@/lib/storage'

export function usePlayerNavigate() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function navigateToPlayer(nickname: string, platform: Platform, fallbackPubgId?: string) {
    if (loading) return
    setLoading(true)
    try {
      const res = await searchPlayer(nickname, platform)

      if (res.cached && res.player) {
        addRecentSearch({ nickname: res.player.nickname, platform, pubgId: res.player.pubgId })
        router.push(`/players/${res.player.pubgId}`)
        return
      }

      // 플레이어가 DB에 없거나 분석이 만료됨 — job 폴링 후 이동
      const knownPubgId = res.pubgId ?? fallbackPubgId

      if (res.jobId) {
        await pollJobUntilDone(res.jobId, () => {})
      }

      if (knownPubgId) {
        addRecentSearch({ nickname, platform, pubgId: knownPubgId })
        router.push(`/players/${knownPubgId}`)
        return
      }

      // pubgId 미확보 — 재검색으로 획득
      const res2 = await searchPlayer(nickname, platform)
      const targetPubgId = res2.player?.pubgId ?? res2.pubgId
      if (targetPubgId) {
        addRecentSearch({ nickname: res2.player?.nickname ?? nickname, platform, pubgId: targetPubgId })
        router.push(`/players/${targetPubgId}`)
      }
    } catch {
      if (fallbackPubgId) router.push(`/players/${fallbackPubgId}`)
    } finally {
      setLoading(false)
    }
  }

  return { navigateToPlayer, loading }
}
