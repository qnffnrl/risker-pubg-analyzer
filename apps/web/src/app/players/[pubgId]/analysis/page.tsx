import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { getPlayer, getPlayerAnalysis, type AnalysisData, type AggressionMetrics, type SurvivalMetrics, type PositioningMetrics, type TeamplayMetrics, type ConsistencyMetrics, type ClutchMetrics } from '@/lib/api'
import { RadarChart, type StyleScores } from '@/components/ui/radar-chart'
import { StatCard } from '@/components/ui/stat-card'
import { getStyleLabel } from '@/lib/style-label'
import { AnalysisToggle } from './analysis-toggle'

interface Props {
  params: { pubgId: string }
}

function fmt(n: number | undefined, decimals = 1): string {
  if (n === undefined) return '-'
  return n.toFixed(decimals)
}

function fmtInt(n: number | undefined): string {
  if (n === undefined) return '-'
  return Math.round(n).toString()
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

interface MetricRowProps {
  label: string
  value: string
  hint?: string
  showHint?: boolean
}

function MetricRow({ label, value, hint, showHint }: MetricRowProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-secondary/40 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-bold tabular-nums text-foreground">{value}</span>
      </div>
      {hint && showHint && (
        <span className="text-[10px] text-amber-400">⚠ {hint}</span>
      )}
    </div>
  )
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

  const consistencyNum = analysis.consistencyScore != null ? Number(analysis.consistencyScore) : 0
  const clutchNum = analysis.clutchScore != null ? Number(analysis.clutchScore) : 0

  const v1Scores: StyleScores = {
    aggression: Number(analysis.aggressionScore),
    survival: Number(analysis.survivalScore),
    positioning: Number(analysis.positioningScore),
    teamplay: Number(analysis.teamplayScore),
    consistency: consistencyNum,
    clutch: clutchNum,
  }

  const v2Scores: StyleScores | null = analysis.aggressionScoreV2
    ? {
        aggression: Number(analysis.aggressionScoreV2),
        survival: Number(analysis.survivalScoreV2 ?? 0),
        positioning: Number(analysis.positioningScoreV2 ?? 0),
        teamplay: Number(analysis.teamplayScoreV2 ?? 0),
        consistency: consistencyNum,
        clutch: clutchNum,
      }
    : null

  const label = getStyleLabel(v1Scores.aggression, v1Scores.survival, v1Scores.positioning, v1Scores.teamplay)
  const agg = analysis.aggressionMetrics
  const sur = analysis.survivalMetrics
  const pos = analysis.positioningMetrics
  const team = analysis.teamplayMetrics
  const con = analysis.consistencyMetrics ?? null
  const clutch = analysis.clutchMetrics ?? null

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
            {/* Skill Score Card */}
            {analysis.skillScore && (
              <div className="w-full border border-neutral-800 rounded-lg p-4 text-center">
                <p className="text-xs text-neutral-400 mb-1">실력 점수</p>
                <p className="text-4xl font-bold text-white">{Math.round(Number(analysis.skillScore))}</p>
                <p className="text-xs text-neutral-500 mt-1">킬력·데미지·순위 기반 종합 점수</p>
              </div>
            )}

            {/* v1/v2 toggle + radar chart */}
            <AnalysisToggle
              v1Scores={v1Scores}
              v2Scores={v2Scores}
              hasV2={v2Scores !== null}
              label={label}
              matchCount={analysis.matchCount}
              analyzedAt={analyzedAt}
              llmSummary={analysis.llmSummary ?? null}
            />
          </div>

          {/* 우측: 6대 성향 상세 지표 */}
          <div className="flex flex-col gap-4 lg:w-[60%]">
            {/* 공격성 */}
            <Section title="공격성" color="text-rose-400" score={v1Scores.aggression}>
              <StatCard label="킬/매치" value={fmt(agg['avg_kills'])} color="aggression" />
              <StatCard label="데미지/매치" value={Math.round(agg['avg_damage'] ?? 0)} color="aggression" />
              <StatCard label="헤드샷율" value={fmtPct(agg['headshot_rate'])} color="aggression" />
              <StatCard label="교전참여율" value={fmtPct(agg['kill_participation_rate'])} color="aggression" />
              <div className="col-span-full flex flex-col gap-1.5">
                <MetricRow
                  label="킬당 데미지"
                  value={agg['damage_per_kill'] !== undefined ? fmtInt(agg['damage_per_kill']) : '—'}
                  hint="마무리 능력 개선 필요"
                  showHint={agg['damage_per_kill'] !== undefined && agg['damage_per_kill'] < 100}
                />
                <MetricRow
                  label="교전 참여율"
                  value={agg['games_with_kills_rate'] !== undefined ? fmtPct(agg['games_with_kills_rate']) : '—'}
                  hint="더 적극적인 교전 참여 필요"
                  showHint={agg['games_with_kills_rate'] !== undefined && agg['games_with_kills_rate'] < 0.5}
                />
                <MetricRow
                  label="분당 데미지"
                  value={agg['damage_per_minute'] !== undefined ? fmtInt(agg['damage_per_minute']) : '—'}
                  hint="교전 빈도 증가 필요"
                  showHint={agg['damage_per_minute'] !== undefined && agg['damage_per_minute'] < 30}
                />
              </div>
            </Section>

            {/* 생존형 */}
            <Section title="생존형" color="text-emerald-400" score={v1Scores.survival}>
              <StatCard label="평균 생존시간" value={fmtTime(sur['avg_survival_time_sec'])} color="survival" />
              <StatCard label="평균 순위" value={`#${fmt(sur['avg_placement'])}`} color="survival" />
              <StatCard label="탑10율" value={fmtPct(sur['top10_rate'])} color="survival" />
              <StatCard label="승률" value={fmtPct(sur['win_rate'])} color="survival" />
              <StatCard label="평균 부스터" value={fmt(sur['avg_boosts'])} color="survival" />
              <StatCard label="평균 힐" value={fmt(sur['avg_heals'])} color="survival" />
              <div className="col-span-full flex flex-col gap-1.5">
                <MetricRow
                  label="생존 비율"
                  value={sur['survival_ratio'] !== undefined ? fmtPct(sur['survival_ratio']) : '—'}
                  hint="초반 교전 자제 필요"
                  showHint={sur['survival_ratio'] !== undefined && sur['survival_ratio'] < 0.4}
                />
                <MetricRow
                  label="Top10→우승 전환율"
                  value={sur['top10_to_win_rate'] !== undefined ? fmtPct(sur['top10_to_win_rate']) : '—'}
                  hint="엔딩존 교전 능력 개선 필요"
                  showHint={sur['top10_to_win_rate'] !== undefined && sur['top10_to_win_rate'] < 0.15}
                />
                <MetricRow
                  label="부스터 활용도"
                  value={sur['boost_ratio'] !== undefined ? fmtPct(sur['boost_ratio']) : '—'}
                  hint="부스터 우선 사용 권장"
                  showHint={sur['boost_ratio'] !== undefined && sur['boost_ratio'] < 0.3}
                />
                <MetricRow
                  label="게임당 아이템"
                  value={sur['total_items_per_game'] !== undefined ? fmt(sur['total_items_per_game'], 1) : '—'}
                  hint="아이템 루팅 적극성 필요"
                  showHint={sur['total_items_per_game'] !== undefined && sur['total_items_per_game'] < 2}
                />
              </div>
            </Section>

            {/* 포지셔닝 */}
            <Section title="포지셔닝" color="text-blue-400" score={v1Scores.positioning}>
              <StatCard label="도보 이동" value={fmtDist(pos['avg_walk_distance'])} color="positioning" />
              <StatCard label="차량 이동" value={fmtDist(pos['avg_vehicle_distance'])} color="positioning" />
              <StatCard label="차량 사용율" value={fmtPct(pos['vehicle_usage_rate'])} color="positioning" />
              <StatCard label="평균 무기수" value={fmt(pos['avg_weapons_acquired'])} color="positioning" />
              <StatCard label="탑10율" value={fmtPct(pos['top10_rate'])} color="positioning" />
            </Section>

            {/* 팀플레이 */}
            <Section title="팀플레이" color="text-amber-400" score={v1Scores.teamplay}>
              <StatCard label="평균 부활" value={fmt(team['avg_revives'])} color="teamplay" />
              <StatCard label="평균 어시스트" value={fmt(team['avg_assists'])} color="teamplay" />
              <StatCard label="팀킬" value={fmt(team['avg_team_kills'])} color="teamplay" />
            </Section>

            {/* 일관성 */}
            <SectionCustom
              title="일관성"
              color="text-violet-400"
              score={analysis.consistencyScore != null ? consistencyNum : null}
            >
              {con ? (
                <div className="flex flex-col gap-1.5">
                  <MetricRow
                    label="킬 일관성"
                    value={con.kill_consistency !== undefined ? fmtPct(con.kill_consistency) : '—'}
                    hint="킬 편차가 큼, 실력 일관성 향상 필요"
                    showHint={con.kill_consistency !== undefined && con.kill_consistency < 0.4}
                  />
                  <MetricRow
                    label="데미지 일관성"
                    value={con.damage_consistency !== undefined ? fmtPct(con.damage_consistency) : '—'}
                    hint="데미지 편차가 큼, 안정적 교전 필요"
                    showHint={con.damage_consistency !== undefined && con.damage_consistency < 0.4}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">데이터 없음 — 재분석 후 표시됩니다</p>
              )}
            </SectionCustom>

            {/* 결정력 */}
            <SectionCustom
              title="결정력"
              color="text-orange-400"
              score={analysis.clutchScore != null ? clutchNum : null}
            >
              {clutch ? (
                <div className="flex flex-col gap-1.5">
                  <MetricRow
                    label="넉다운 마무리율"
                    value={clutch.knock_finish_rate !== undefined ? fmtPct(clutch.knock_finish_rate) : '—'}
                    hint="넉다운 후 빠른 마무리 필요"
                    showHint={clutch.knock_finish_rate !== undefined && clutch.knock_finish_rate < 0.7}
                  />
                  <MetricRow
                    label="평균 연속킬"
                    value={clutch.kill_streak_avg !== undefined ? fmt(clutch.kill_streak_avg, 1) : '—'}
                  />
                  <MetricRow
                    label="Top10→우승 전환율"
                    value={clutch.top10_to_win_rate !== undefined ? fmtPct(clutch.top10_to_win_rate) : '—'}
                    hint="엔딩 교전 결정력 필요"
                    showHint={clutch.top10_to_win_rate !== undefined && clutch.top10_to_win_rate < 0.15}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">데이터 없음 — 재분석 후 표시됩니다</p>
              )}
            </SectionCustom>
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

function SectionCustom({ title, color, score, children }: {
  title: string
  color: string
  score: number | null
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
        {score !== null ? (
          <span className="text-xs font-bold tabular-nums text-muted-foreground">{score.toFixed(1)} / 100</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      {children}
    </div>
  )
}
