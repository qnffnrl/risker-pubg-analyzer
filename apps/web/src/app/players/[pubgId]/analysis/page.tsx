import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { getPlayer, getPlayerAnalysis } from '@/lib/api'
import { RadarChart } from '@/components/ui/radar-chart'
import { StatCard } from '@/components/ui/stat-card'
import { getStyleLabel } from '@/lib/style-label'

interface Props {
  params: { pubgId: string }
}

function fmt(n: number | undefined, decimals = 1): string {
  if (n === undefined) return '-'
  return n.toFixed(decimals)
}

function fmtTime(sec: number | undefined): string {
  if (!sec) return '-'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtPct(n: number | undefined): string {
  if (n === undefined) return '-'
  return `${Math.round(n * 100)}%`
}

function fmtDist(n: number | undefined): string {
  if (!n) return '-'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}km` : `${Math.round(n)}m`
}

export default async function AnalysisPage({ params }: Props) {
  const { pubgId } = params

  let profile: Awaited<ReturnType<typeof getPlayer>> | undefined
  let analysis: Awaited<ReturnType<typeof getPlayerAnalysis>> | null | undefined
  try {
    profile = await getPlayer(pubgId)
    analysis = await getPlayerAnalysis(pubgId).catch(() => profile?.latestAnalysis)
  } catch {
    notFound()
  }

  if (!analysis) {
    return (
      <AppShell showSidebar showHeaderSearch>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg font-semibold text-foreground">분석 결과가 없습니다</p>
          <p className="text-sm text-muted-foreground">플레이어 페이지에서 분석을 시작해주세요.</p>
          <Link href={`/players/${pubgId}`} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            프로필로 이동
          </Link>
        </div>
      </AppShell>
    )
  }

  const scores = {
    aggression: Number(analysis.aggressionScore),
    survival: Number(analysis.survivalScore),
    positioning: Number(analysis.positioningScore),
    teamplay: Number(analysis.teamplayScore),
  }

  const label = getStyleLabel(scores.aggression, scores.survival, scores.positioning, scores.teamplay)
  const agg = analysis.aggressionMetrics as Record<string, number>
  const sur = analysis.survivalMetrics as Record<string, number>
  const pos = analysis.positioningMetrics as Record<string, number>
  const team = analysis.teamplayMetrics as Record<string, number>

  const analyzedAt = new Date(analysis.analyzedAt).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <AppShell showSidebar showHeaderSearch>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 뒤로가기 */}
        <Link href={`/players/${pubgId}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {profile?.player.nickname} 프로필
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* 좌측: 레이더 차트 + 성향 레이블 */}
          <div className="flex flex-col items-center gap-4 lg:w-[40%]">
            <div className="w-full rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">플레이 스타일</h2>
              <div className="flex justify-center">
                <RadarChart data={scores} size="lg" />
              </div>
              {/* 점수 표 */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: '공격성', value: scores.aggression, color: 'text-rose-400' },
                  { label: '생존형', value: scores.survival, color: 'text-emerald-400' },
                  { label: '포지셔닝', value: scores.positioning, color: 'text-blue-400' },
                  { label: '팀플레이', value: scores.teamplay, color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-bold tabular-nums ${color}`}>{value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 성향 레이블 */}
            <div className="w-full rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
              <div className="mb-2 text-3xl">{label.icon}</div>
              <div className="text-lg font-bold text-foreground">{label.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{label.desc}</div>
            </div>

            {/* 분석 기준 */}
            <p className="text-center text-xs text-muted-foreground">
              최근 {analysis.matchCount}매치 기준 · 업데이트: {analyzedAt}
            </p>

            {/* LLM 요약 (T-011) */}
            {analysis.llmSummary && (
              <div className="w-full rounded-xl border border-border bg-card p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI 성향 요약</p>
                <p className="text-sm leading-relaxed text-foreground">{analysis.llmSummary}</p>
              </div>
            )}
          </div>

          {/* 우측: 4대 성향 상세 지표 */}
          <div className="flex flex-col gap-4 lg:w-[60%]">
            {/* 공격성 */}
            <Section title="공격성" color="text-rose-400" score={scores.aggression}>
              <StatCard label="킬/매치" value={fmt(agg['avg_kills'])} color="aggression" />
              <StatCard label="데미지/매치" value={Math.round(agg['avg_damage'] ?? 0)} color="aggression" />
              <StatCard label="헤드샷율" value={fmtPct(agg['headshot_rate'])} color="aggression" />
              <StatCard label="교전참여율" value={fmtPct(agg['kill_participation_rate'])} color="aggression" />
            </Section>

            {/* 생존형 */}
            <Section title="생존형" color="text-emerald-400" score={scores.survival}>
              <StatCard label="평균 생존시간" value={fmtTime(sur['avg_survival_time_sec'])} color="survival" />
              <StatCard label="평균 순위" value={`#${fmt(sur['avg_placement'])}`} color="survival" />
              <StatCard label="탑10율" value={fmtPct(sur['top10_rate'])} color="survival" />
              <StatCard label="승률" value={fmtPct(sur['win_rate'])} color="survival" />
              <StatCard label="평균 부스터" value={fmt(sur['avg_boosts'])} color="survival" />
              <StatCard label="평균 힐" value={fmt(sur['avg_heals'])} color="survival" />
            </Section>

            {/* 포지셔닝 */}
            <Section title="포지셔닝" color="text-blue-400" score={scores.positioning}>
              <StatCard label="도보 이동" value={fmtDist(pos['avg_walk_distance'])} color="positioning" />
              <StatCard label="차량 이동" value={fmtDist(pos['avg_vehicle_distance'])} color="positioning" />
              <StatCard label="차량 사용율" value={fmtPct(pos['vehicle_usage_rate'])} color="positioning" />
              <StatCard label="평균 무기수" value={fmt(pos['avg_weapons_acquired'])} color="positioning" />
              <StatCard label="탑10율" value={fmtPct(pos['top10_rate'])} color="positioning" />
            </Section>

            {/* 팀플레이 */}
            <Section title="팀플레이" color="text-amber-400" score={scores.teamplay}>
              <StatCard label="평균 부활" value={fmt(team['avg_revives'])} color="teamplay" />
              <StatCard label="평균 어시스트" value={fmt(team['avg_assists'])} color="teamplay" />
              <StatCard label="팀킬" value={fmt(team['avg_team_kills'])} color="teamplay" />
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Section({ title, color, score, children }: {
  title: string
  color: string
  score: number
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">{score.toFixed(1)} / 100</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {children}
      </div>
    </div>
  )
}
