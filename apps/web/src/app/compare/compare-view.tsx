'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, Copy, Check } from 'lucide-react'
import { RadarChart, type StyleScores } from '@/components/ui/radar-chart'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { PlatformBadge } from '@/components/ui/platform-badge'
import type { PlayerData, AnalysisData } from '@/lib/api'

interface Entry {
  player: PlayerData
  analysis: AnalysisData | null
}

interface CompareViewProps {
  entryA: Entry
  entryB: Entry
}

type Tab = 'radar' | 'scores' | 'table'

function toScores(analysis: AnalysisData | null): StyleScores | null {
  if (!analysis) return null
  return {
    aggression: parseFloat(analysis.aggressionScore) * 100,
    survival: parseFloat(analysis.survivalScore) * 100,
    positioning: parseFloat(analysis.positioningScore) * 100,
    teamplay: parseFloat(analysis.teamplayScore) * 100,
  }
}

function fmtSeconds(sec: number | undefined): string {
  if (sec === undefined || sec === null) return '-'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtNum(val: number | undefined, decimals = 1): string {
  if (val === undefined || val === null) return '-'
  return val.toFixed(decimals)
}

function fmtPct(val: number | undefined): string {
  if (val === undefined || val === null) return '-'
  return `${(val * 100).toFixed(1)}%`
}

function fmtKm(val: number | undefined): string {
  if (val === undefined || val === null) return '-'
  return `${(val / 1000).toFixed(2)}km`
}

interface MetricRow {
  label: string
  aVal: string
  bVal: string
  aRaw: number | undefined
  bRaw: number | undefined
  lowerIsBetter?: boolean
}

function buildMetrics(a: AnalysisData | null, b: AnalysisData | null): MetricRow[] {
  const am = a?.aggressionMetrics ?? {}
  const bm = b?.aggressionMetrics ?? {}
  const as_ = a?.survivalMetrics ?? {}
  const bs = b?.survivalMetrics ?? {}
  const ap = a?.positioningMetrics ?? {}
  const bp = b?.positioningMetrics ?? {}
  const at = a?.teamplayMetrics ?? {}
  const bt = b?.teamplayMetrics ?? {}

  return [
    { label: '킬/매치', aVal: fmtNum(am['avg_kills']), bVal: fmtNum(bm['avg_kills']), aRaw: am['avg_kills'], bRaw: bm['avg_kills'] },
    { label: '데미지/매치', aVal: fmtNum(am['avg_damage'], 0), bVal: fmtNum(bm['avg_damage'], 0), aRaw: am['avg_damage'], bRaw: bm['avg_damage'] },
    { label: '헤드샷율', aVal: fmtPct(am['headshot_rate']), bVal: fmtPct(bm['headshot_rate']), aRaw: am['headshot_rate'], bRaw: bm['headshot_rate'] },
    { label: '평균 순위', aVal: as_['avg_placement'] !== undefined ? `#${fmtNum(as_['avg_placement'], 1)}` : '-', bVal: bs['avg_placement'] !== undefined ? `#${fmtNum(bs['avg_placement'], 1)}` : '-', aRaw: as_['avg_placement'], bRaw: bs['avg_placement'], lowerIsBetter: true },
    { label: '탑10율', aVal: fmtPct(as_['top10_rate']), bVal: fmtPct(bs['top10_rate']), aRaw: as_['top10_rate'], bRaw: bs['top10_rate'] },
    { label: '승률', aVal: fmtPct(as_['win_rate']), bVal: fmtPct(bs['win_rate']), aRaw: as_['win_rate'], bRaw: bs['win_rate'] },
    { label: '평균 생존시간', aVal: fmtSeconds(as_['avg_survival_time_sec']), bVal: fmtSeconds(bs['avg_survival_time_sec']), aRaw: as_['avg_survival_time_sec'], bRaw: bs['avg_survival_time_sec'] },
    { label: '도보 이동', aVal: fmtKm(ap['avg_walk_distance']), bVal: fmtKm(bp['avg_walk_distance']), aRaw: ap['avg_walk_distance'], bRaw: bp['avg_walk_distance'] },
    { label: '차량 이동', aVal: fmtKm(ap['avg_vehicle_distance']), bVal: fmtKm(bp['avg_vehicle_distance']), aRaw: ap['avg_vehicle_distance'], bRaw: bp['avg_vehicle_distance'] },
    { label: '평균 부활', aVal: fmtNum(at['avg_revives']), bVal: fmtNum(bt['avg_revives']), aRaw: at['avg_revives'], bRaw: bt['avg_revives'] },
    { label: '어시스트', aVal: fmtNum(at['avg_assists']), bVal: fmtNum(bt['avg_assists']), aRaw: at['avg_assists'], bRaw: bt['avg_assists'] },
  ]
}

function WinnerBadge({ winner }: { winner: 'a' | 'b' | 'tie' | 'none' }) {
  if (winner === 'none') return <span className="text-muted-foreground text-xs">-</span>
  if (winner === 'tie') return <span className="text-muted-foreground text-xs">동률</span>
  return (
    <span className={`text-xs font-semibold ${winner === 'a' ? 'text-primary' : 'text-amber-400'}`}>
      {winner === 'a' ? 'A ↑' : 'B ↑'}
    </span>
  )
}

function getWinner(row: MetricRow): 'a' | 'b' | 'tie' | 'none' {
  if (row.aRaw === undefined || row.bRaw === undefined) return 'none'
  if (row.aRaw === row.bRaw) return 'tie'
  const aWins = row.lowerIsBetter ? row.aRaw < row.bRaw : row.aRaw > row.bRaw
  return aWins ? 'a' : 'b'
}

const SCORE_LABELS: { key: keyof StyleScores; label: string }[] = [
  { key: 'aggression', label: '공격성' },
  { key: 'survival', label: '생존형' },
  { key: 'positioning', label: '포지셔닝' },
  { key: 'teamplay', label: '팀플레이' },
]

export function CompareView({ entryA, entryB }: CompareViewProps) {
  const [tab, setTab] = useState<Tab>('radar')
  const [copied, setCopied] = useState(false)

  const scoresA = toScores(entryA.analysis)
  const scoresB = toScores(entryB.analysis)

  const metrics = buildMetrics(entryA.analysis, entryB.analysis)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? 'bg-primary/20 text-primary border border-primary/40'
        : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-foreground">플레이어 비교</h1>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '복사됨' : 'URL 복사'}
        </button>
      </div>

      {/* A vs B 헤더 */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* A */}
        <div className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-card p-4">
          <PlayerAvatar nickname={entryA.player.nickname} size="md" />
          <p className="font-bold text-foreground text-center">{entryA.player.nickname}</p>
          <PlatformBadge platform={entryA.player.platform} />
          <span className="text-xs text-primary font-semibold">A</span>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">VS</span>
        </div>

        {/* B */}
        <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-400/30 bg-card p-4">
          <PlayerAvatar nickname={entryB.player.nickname} size="md" />
          <p className="font-bold text-foreground text-center">{entryB.player.nickname}</p>
          <PlatformBadge platform={entryB.player.platform} />
          <span className="text-xs text-amber-400 font-semibold">B</span>
        </div>
      </div>

      {/* 재검색 링크 */}
      <div className="text-center">
        <Link href="/compare" className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2">
          다른 플레이어와 비교하기
        </Link>
      </div>

      {/* 모바일 탭 */}
      <div className="flex gap-2 lg:hidden">
        <button className={tabClass('radar')} onClick={() => setTab('radar')}>레이더</button>
        <button className={tabClass('scores')} onClick={() => setTab('scores')}>점수</button>
        <button className={tabClass('table')} onClick={() => setTab('table')}>지표</button>
      </div>

      {/* 레이더 차트 — 모바일: 탭 선택 시, 데스크탑: 항상 표시 */}
      <div className={tab === 'radar' ? 'block' : 'hidden lg:block'}>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground text-center">플레이 성향 비교</h2>
          {scoresA || scoresB ? (
            <>
              <div className="flex justify-center">
                <RadarChart
                  data={scoresA ?? { aggression: 0, survival: 0, positioning: 0, teamplay: 0 }}
                  compareData={scoresB ?? { aggression: 0, survival: 0, positioning: 0, teamplay: 0 }}
                  size="lg"
                />
              </div>
              {/* 범례 */}
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">A — {entryA.player.nickname}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="text-xs text-muted-foreground">B — {entryB.player.nickname}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">분석 데이터 없음</p>
          )}
        </div>
      </div>

      {/* 성향 점수 바 — 모바일: 탭 선택 시, 데스크탑: 항상 표시 */}
      <div className={tab === 'scores' ? 'block' : 'hidden lg:block'}>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">성향 점수</h2>
          {SCORE_LABELS.map(({ key, label }) => {
            const aScore = scoresA?.[key] ?? 0
            const bScore = scoresB?.[key] ?? 0
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span>{aScore.toFixed(1)} / {bScore.toFixed(1)}</span>
                </div>
                <div className="flex gap-1">
                  {/* A 바 */}
                  <div className="flex-1 space-y-1">
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(aScore, 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* B 바 */}
                  <div className="flex-1 space-y-1">
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.min(bScore, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span className="text-primary">A</span>
                  <span className="text-amber-400">B</span>
                </div>
              </div>
            )
          })}
          {!scoresA && !scoresB && (
            <p className="text-center text-sm text-muted-foreground py-4">분석 데이터 없음</p>
          )}
        </div>
      </div>

      {/* 상세 지표 테이블 — 모바일: 탭 선택 시, 데스크탑: 항상 표시 */}
      <div className={tab === 'table' ? 'block' : 'hidden lg:block'}>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">상세 지표 비교</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">항목</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-primary">A</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-amber-400">B</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">승자</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((row, i) => {
                  const winner = getWinner(row)
                  return (
                    <tr key={row.label} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.label}</td>
                      <td className={`px-4 py-2.5 text-center text-xs font-medium ${winner === 'a' ? 'text-primary' : 'text-foreground'}`}>
                        {row.aVal}
                      </td>
                      <td className={`px-4 py-2.5 text-center text-xs font-medium ${winner === 'b' ? 'text-amber-400' : 'text-foreground'}`}>
                        {row.bVal}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <WinnerBadge winner={winner} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!entryA.analysis && !entryB.analysis && (
            <p className="text-center text-sm text-muted-foreground py-6">분석 데이터 없음</p>
          )}
        </div>
      </div>
    </div>
  )
}
