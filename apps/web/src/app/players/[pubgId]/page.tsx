import { AppShell } from '@/components/layout/app-shell'
import { PlayerCardSkeleton, StatCardSkeleton, RadarChartSkeleton } from '@/components/ui/loading-skeleton'

interface Props {
  params: { pubgId: string }
}

export default function PlayerPage({ params }: Props) {
  return (
    <AppShell showSidebar showHeaderSearch>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-6 text-sm text-muted-foreground">
          플레이어: <span className="font-mono text-foreground">{params.pubgId}</span>
        </p>
        {/* T-009에서 구현 예정 */}
        <div className="space-y-4">
          <PlayerCardSkeleton />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
          </div>
          <RadarChartSkeleton className="h-64 w-full" />
        </div>
      </div>
    </AppShell>
  )
}
