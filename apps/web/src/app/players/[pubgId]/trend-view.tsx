'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { MatchStat } from '@/lib/api'

interface Props {
  matches: MatchStat[]
}

type Metric = 'kills' | 'damage' | 'placement' | 'survived'
type Period = '10' | '20' | 'all'

const METRIC_LABELS: Record<Metric, string> = {
  kills: '킬',
  damage: '데미지',
  placement: '순위',
  survived: '생존(분)',
}

const METRIC_COLORS: Record<Metric, string> = {
  kills: '#f43f5e',
  damage: '#f97316',
  placement: '#a855f7',
  survived: '#22c55e',
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function TrendView({ matches }: Props) {
  const [metric, setMetric] = useState<Metric>('kills')
  const [period, setPeriod] = useState<Period>('20')

  const sorted = useMemo(
    () => [...matches].sort((a, b) => (a.playedAt ?? '').localeCompare(b.playedAt ?? '')),
    [matches],
  )

  const filtered = useMemo(() => {
    if (period === 'all') return sorted
    const n = Number(period)
    return sorted.slice(-n)
  }, [sorted, period])

  const chartData = filtered.map((m, i) => ({
    index: i + 1,
    kills: m.kills ?? 0,
    damage: Math.round(parseFloat(m.damageDealt ?? '0')),
    placement: m.placement ?? 99,
    survived: Math.round((m.timeSurvived ?? 0) / 60),
  }))

  // Form analysis
  const recent5 = filtered.slice(-5)
  const prev = filtered.slice(0, Math.max(0, filtered.length - 5))

  const r5AvgKills = avg(recent5.map((m) => m.kills ?? 0))
  const r5AvgDmg = avg(recent5.map((m) => Math.round(parseFloat(m.damageDealt ?? '0'))))
  const prevAvgKills = avg(prev.map((m) => m.kills ?? 0))
  const prevAvgDmg = avg(prev.map((m) => Math.round(parseFloat(m.damageDealt ?? '0'))))

  const trend =
    prev.length === 0
      ? 'stable'
      : r5AvgKills > prevAvgKills * 1.05
        ? 'up'
        : r5AvgKills < prevAvgKills * 0.95
          ? 'down'
          : 'stable'

  const overallAvgKills = avg(filtered.map((m) => m.kills ?? 0))
  const recent3AvgKills = avg(filtered.slice(-3).map((m) => m.kills ?? 0))
  const isHotStreak = filtered.length >= 3 && recent3AvgKills >= overallAvgKills * 1.5
  const isSlump = filtered.length >= 3 && recent3AvgKills <= overallAvgKills * 0.5 && overallAvgKills > 0

  const killsDelta = r5AvgKills - prevAvgKills
  const dmgDelta = r5AvgDmg - prevAvgDmg

  if (matches.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400">
        <span className="text-2xl">📊</span>
        <span className="text-sm">매치 데이터가 없습니다</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">기간</span>
          {(['10', '20', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p === 'all' ? '전체' : `최근 ${p}게임`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">지표</span>
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                metric === m
                  ? 'text-primary-foreground'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={metric === m ? { backgroundColor: METRIC_COLORS[m] } : undefined}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* 라인 차트 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">
          {METRIC_LABELS[metric]} 추이
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="index" tick={false} axisLine={false} tickLine={false} />
            <YAxis
              reversed={metric === 'placement'}
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#a1a1aa' }}
              formatter={(value) => [
                `${value ?? 0}${metric === 'placement' ? '위' : metric === 'survived' ? '분' : metric === 'damage' ? '' : '킬'}`,
                METRIC_LABELS[metric],
              ]}
              labelFormatter={(label) => `${label}번째 게임`}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={METRIC_COLORS[metric]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 폼 카드 + 배지 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 폼 분석 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-300">최근 폼</p>
            {trend === 'up' && <span className="text-base text-green-400">↑</span>}
            {trend === 'down' && <span className="text-base text-red-400">↓</span>}
            {trend === 'stable' && <span className="text-base text-zinc-400">→</span>}
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400'}`}>
              {trend === 'up' ? '상승세' : trend === 'down' ? '하락세' : '유지'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">최근 5게임 킬</span>
              <span className="font-medium text-white">
                {r5AvgKills.toFixed(1)}
                {prev.length > 0 && (
                  <span className={`ml-1.5 ${killsDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {killsDelta >= 0 ? '+' : ''}{killsDelta.toFixed(1)}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">최근 5게임 데미지</span>
              <span className="font-medium text-white">
                {Math.round(r5AvgDmg)}
                {prev.length > 0 && (
                  <span className={`ml-1.5 ${dmgDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dmgDelta >= 0 ? '+' : ''}{Math.round(dmgDelta)}
                  </span>
                )}
              </span>
            </div>
            {prev.length > 0 && (
              <p className="text-[10px] text-zinc-600">이전 {prev.length}게임 평균 대비</p>
            )}
          </div>
        </div>

        {/* 스트릭 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-300">스트릭</p>
          <div className="space-y-2">
            {isHotStreak && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-400">
                🔥 핫 스트릭
              </div>
            )}
            {isSlump && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400">
                😰 슬럼프
              </div>
            )}
            {!isHotStreak && !isSlump && (
              <p className="text-xs text-zinc-500">특이 스트릭 없음</p>
            )}
            <p className="text-[10px] text-zinc-600">
              전체 평균 킬: {overallAvgKills.toFixed(1)} · 최근 3게임 평균: {recent3AvgKills.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
