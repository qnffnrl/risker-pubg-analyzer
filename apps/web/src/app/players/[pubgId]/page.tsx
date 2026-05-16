import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { getPlayer, getPlayerMatches } from '@/lib/api'
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

  return (
    <AppShell showSidebar showHeaderSearch>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <PlayerHeader player={profile.player} analysis={profile.latestAnalysis} />
        <SummaryStats analysis={profile.latestAnalysis} />
        {profile.latestAnalysis && (
          <StylePreview analysis={profile.latestAnalysis} pubgId={pubgId} />
        )}
        <MatchList initialMatches={matchesData.matches} pubgId={pubgId} />
      </div>
    </AppShell>
  )
}
