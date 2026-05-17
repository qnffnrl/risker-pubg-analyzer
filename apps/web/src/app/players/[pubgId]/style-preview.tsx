import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { RadarChart } from '@/components/ui/radar-chart'
import { StyleScoreBars } from '@/components/style-score-bars'
import type { AnalysisData } from '@/lib/api'

interface StylePreviewProps {
  analysis: AnalysisData
  pubgId: string
}

export function StylePreview({ analysis, pubgId }: StylePreviewProps) {
  const scores = {
    aggression: Number(analysis.aggressionScore),
    survival: Number(analysis.survivalScore),
    positioning: Number(analysis.positioningScore),
    teamplay: Number(analysis.teamplayScore),
    consistency: analysis.consistencyScore != null ? Number(analysis.consistencyScore) : 0,
    clutch: analysis.clutchScore != null ? Number(analysis.clutchScore) : 0,
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">플레이 스타일</h2>
        <Link
          href={`/players/${pubgId}/analysis`}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          상세 분석 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="shrink-0">
          <RadarChart data={scores} size="sm" />
        </div>
        <div className="w-full flex-1">
          <StyleScoreBars {...scores} />
        </div>
      </div>
    </div>
  )
}
