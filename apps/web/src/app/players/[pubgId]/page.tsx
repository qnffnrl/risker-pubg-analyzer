import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/app-shell'
import { getPlayer, getPlayerMatches, getWeaponStats, getMapStats, getRankedStats } from '@/lib/api'
import { AutoRefresh } from '@/components/auto-refresh'
import { PlayerHeader } from './player-header'
import { SummaryStats } from './summary-stats'
import { StylePreview } from './style-preview'
import { PlayerTabs } from './player-tabs'

interface Props {
  params: { pubgId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pubgId } = params
  try {
    const profile = await getPlayer(pubgId)
    const analysis = profile.latestAnalysis
    const nickname = profile.player.nickname
    const agg = analysis ? Math.round(Number(analysis.aggressionScore)) : 0
    const sur = analysis ? Math.round(Number(analysis.survivalScore)) : 0
    const pos = analysis ? Math.round(Number(analysis.positioningScore)) : 0
    const team = analysis ? Math.round(Number(analysis.teamplayScore)) : 0
    const desc = `공격성 ${agg} · 생존형 ${sur} · 포지셔닝 ${pos} · 팀플레이 ${team}`
    const ogImageUrl = `/api/og?pubgId=${encodeURIComponent(pubgId)}`
    return {
      title: `${nickname}의 PUBG 플레이 스타일 — Risker 분석`,
      description: desc,
      openGraph: {
        title: `${nickname}의 배그 DNA`,
        description: analysis?.llmSummary?.slice(0, 100) ?? desc,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${nickname}의 배그 DNA`,
        description: desc,
        images: [ogImageUrl],
      },
    }
  } catch {
    return { title: 'PUBG 플레이어 — Risker 분석' }
  }
}

export default async function PlayerPage({ params }: Props) {
  const { pubgId } = params

  let profile
  try {
    profile = await getPlayer(pubgId)
  } catch {
    notFound()
  }

  const [matchesData, weaponStats, mapStats, rankedStats] = await Promise.all([
    getPlayerMatches(pubgId, 20, 0).catch(() => ({ matches: [], limit: 20, offset: 0 })),
    getWeaponStats(pubgId).catch(() => null),
    getMapStats(pubgId).catch(() => null),
    getRankedStats(pubgId).catch(() => null),
  ])

  const isPending = matchesData.matches.length === 0 || !profile.latestAnalysis
  const isWeaponPending = !weaponStats && !!profile.latestAnalysis

  return (
    <AppShell showSidebar showHeaderSearch>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <PlayerHeader player={profile.player} analysis={profile.latestAnalysis} />
        {(isPending || isWeaponPending) && (
          <>
            <AutoRefresh delayMs={8000} />
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
              <span className="animate-spin">⏳</span>
              {isPending ? '데이터를 수집하고 분석 중입니다.' : '무기 데이터를 수집 중입니다.'} 잠시 후 자동으로 업데이트됩니다.
            </div>
          </>
        )}
        <SummaryStats analysis={profile.latestAnalysis} />
        {profile.latestAnalysis && (
          <StylePreview analysis={profile.latestAnalysis} pubgId={pubgId} />
        )}
        <PlayerTabs pubgId={pubgId} initialMatches={matchesData.matches} weaponStats={weaponStats} mapStats={mapStats} rankedStats={rankedStats} />
      </div>
    </AppShell>
  )
}
