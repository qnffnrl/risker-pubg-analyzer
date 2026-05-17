'use client'

import { useState } from 'react'
import { RadarChart, type StyleScores } from '@/components/ui/radar-chart'

interface AnalysisToggleProps {
  v1Scores: StyleScores
  v2Scores: StyleScores | null
  hasV2: boolean
  label: { icon: string; name: string; desc: string }
  matchCount: number
  analyzedAt: string
  llmSummary: string | null
}

export function AnalysisToggle({
  v1Scores,
  v2Scores,
  hasV2,
  label,
  matchCount,
  analyzedAt,
  llmSummary,
}: AnalysisToggleProps) {
  const [showV1, setShowV1] = useState(false)

  const activeScores = (!showV1 && hasV2 && v2Scores) ? v2Scores : v1Scores

  return (
    <>
      <div className="w-full rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">플레이 스타일</h2>

        {/* v1/v2 토글 */}
        {hasV2 && (
          <div className="flex items-center justify-center gap-2 mb-3 text-sm">
            <button
              onClick={() => setShowV1(v => !v)}
              className="text-neutral-500 hover:text-neutral-300 underline text-xs"
            >
              {showV1 ? '새 분석 방식으로 보기' : '이전 분석 방식 보기'}
            </button>
            {!showV1 && <span className="text-xs text-neutral-600">(분석 방식 업데이트됨)</span>}
          </div>
        )}

        <div className="flex justify-center">
          <RadarChart data={activeScores} size="lg" />
        </div>
        {/* 점수 표 */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {[
            { label: '공격성', value: activeScores.aggression, color: 'text-rose-400' },
            { label: '생존형', value: activeScores.survival, color: 'text-emerald-400' },
            { label: '포지셔닝', value: activeScores.positioning, color: 'text-blue-400' },
            { label: '팀플레이', value: activeScores.teamplay, color: 'text-amber-400' },
            { label: '일관성', value: activeScores.consistency, color: 'text-violet-400' },
            { label: '결정력', value: activeScores.clutch, color: 'text-orange-400' },
          ].map(({ label: l, value, color }) => (
            <div key={l} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
              <span className="text-muted-foreground">{l}</span>
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
        최근 {matchCount}매치 기준 · 업데이트: {analyzedAt}
      </p>

      {/* LLM 요약 */}
      {llmSummary && (
        <div className="w-full rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI 성향 요약</p>
          <p className="text-sm leading-relaxed text-foreground">{llmSummary}</p>
        </div>
      )}
    </>
  )
}
