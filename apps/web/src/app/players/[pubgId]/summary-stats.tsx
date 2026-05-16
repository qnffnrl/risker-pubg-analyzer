import { StatCard } from '@/components/ui/stat-card'
import type { AnalysisData } from '@/lib/api'

interface SummaryStatsProps {
  analysis: AnalysisData | null
}

export function SummaryStats({ analysis }: SummaryStatsProps) {
  const agg = analysis?.aggressionMetrics
  const sur = analysis?.survivalMetrics

  const avgKills = agg ? agg['avg_kills']?.toFixed(1) ?? '-' : '-'
  const avgDamage = agg ? Math.round(agg['avg_damage'] ?? 0) : '-'
  const avgPlacement = sur ? sur['avg_placement']?.toFixed(1) ?? '-' : '-'
  const matchCount = analysis?.matchCount ?? 0

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="킬/매치" value={avgKills} color="aggression" />
      <StatCard label="데미지/매치" value={avgDamage} color="default" />
      <StatCard label="평균 순위" value={avgPlacement ? `#${avgPlacement}` : '-'} color="survival" />
      <StatCard label="분석 게임수" value={matchCount} color="default" />
    </div>
  )
}
