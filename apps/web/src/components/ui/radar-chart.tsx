'use client'

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

export interface StyleScores {
  aggression: number   // 0-100
  survival: number     // 0-100
  positioning: number  // 0-100
  teamplay: number     // 0-100
  consistency: number  // 0-100
  clutch: number       // 0-100
}

type RadarSize = 'sm' | 'md' | 'lg'

interface RadarChartProps {
  data: StyleScores
  size?: RadarSize
  /** 비교용 두 번째 데이터 (앰버 컬러로 오버레이) */
  compareData?: StyleScores
  className?: string
}

const SIZE_MAP: Record<RadarSize, number> = {
  sm: 180,
  md: 260,
  lg: 340,
}

const AXIS_LABELS: Record<keyof StyleScores, string> = {
  aggression: '공격성',
  survival: '생존형',
  positioning: '포지셔닝',
  teamplay: '팀플레이',
  consistency: '일관성',
  clutch: '결정력',
}

/** StyleScores를 Recharts RadarChart용 배열 데이터로 변환 */
function toChartData(
  primary: StyleScores,
  compare?: StyleScores,
) {
  return (Object.keys(primary) as Array<keyof StyleScores>).map((key) => ({
    axis: AXIS_LABELS[key],
    value: primary[key],
    compareValue: compare ? compare[key] : undefined,
    fullMark: 100,
  }))
}

export function RadarChart({
  data,
  size = 'md',
  compareData,
  className = '',
}: RadarChartProps) {
  const chartData = toChartData(data, compareData)
  const containerSize = SIZE_MAP[size]
  const fontSize = size === 'sm' ? 10 : 12

  return (
    <div
      className={className}
      style={{ width: containerSize, height: containerSize }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          data={chartData}
          margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
        >
          <PolarGrid stroke="hsl(213 28% 18%)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{
              fill: 'hsl(213 15% 50%)',
              fontSize,
            }}
          />

          {/* 메인 데이터 — 사이안 */}
          <Radar
            name="플레이 스타일"
            dataKey="value"
            stroke="hsl(168 100% 42%)"
            fill="hsl(168 100% 42%)"
            fillOpacity={0.2}
            strokeWidth={2}
          />

          {/* 비교 데이터 — 앰버 오버레이 (compareData 있을 때만) */}
          {compareData && (
            <Radar
              name="비교 플레이어"
              dataKey="compareValue"
              stroke="hsl(38 92% 50%)"
              fill="hsl(38 92% 50%)"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
