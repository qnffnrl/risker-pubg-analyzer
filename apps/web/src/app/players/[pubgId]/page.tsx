import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { getPlayer, getPlayerMatches } from '@/lib/api'
import { AutoRefresh } from '@/components/auto-refresh'
import { PlayerHeader } from './player-header'
import { SummaryStats } from './summary-stats'
import { StylePreview } from './style-preview'
import { MatchList } from './match-list'

interface Props {
  params: { pubgId: string }
}

export default async function PlayerPage({ params }: Props) {
  const { pubgId } = params

  let profile
  try {
    profile = await getPlayer(pubgId)
  } catch {
    notFound()
  }

  const matchesData = await getPlayerMatches(pubgId, 20, 0).catch(() => ({ matches: [], limit: 20, offset: 0 }))

  const isPending = matchesData.matches.length === 0 || !profile.latestAnalysis

  return (
    <AppShell showSidebar showHeaderSearch>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <PlayerHeader player={profile.player} analysis={profile.latestAnalysis} />
        {isPending && (
          <>
            <AutoRefresh delayMs={8000} />
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
              <span className="animate-spin">⏳</span>
              데이터를 수집하고 분석 중입니다. 잠시 후 자동으로 업데이트됩니다.
            </div>
          </>
        )}
        <SummaryStats analysis={profile.latestAnalysis} />
        {profile.latestAnalysis && (
          <StylePreview analysis={profile.latestAnalysis} pubgId={pubgId} />
        )}
        <MatchList key={matchesData.matches[0]?.matchId ?? 'empty'} initialMatches={matchesData.matches} pubgId={pubgId} />
      </div>
    </AppShell>
  )
}
