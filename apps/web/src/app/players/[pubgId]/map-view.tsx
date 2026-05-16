'use client'

import type { MapStat } from '@/lib/api'

interface Props {
  mapStats: MapStat[]
  totalGames: number
}

const MAP_NAMES: Record<string, string> = {
  Baltic_Main: '에란겔',
  Desert_Main: '미라마',
  Savage_Main: '사녹',
  Tiger_Main: '태이고',
  Kiki_Main: '데스턴',
  Vikendi_Main: '비켄디',
  Chimera_Main: '파라모',
  Heaven_Main: '헤이븐',
  Neon_Main: '론도',
  DihoroV2_Main: '카라킨',
  Range_Main: '훈련장',
}

const MAP_COLORS: Record<string, string> = {
  Baltic_Main: 'bg-green-500/70',
  Desert_Main: 'bg-yellow-500/70',
  Savage_Main: 'bg-emerald-500/70',
  Tiger_Main: 'bg-orange-500/70',
  Kiki_Main: 'bg-blue-500/70',
  Vikendi_Main: 'bg-cyan-500/70',
  Chimera_Main: 'bg-purple-500/70',
  Heaven_Main: 'bg-red-500/70',
  Neon_Main: 'bg-pink-500/70',
  DihoroV2_Main: 'bg-amber-500/70',
}

const MAP_TEXT_COLORS: Record<string, string> = {
  Baltic_Main: 'text-green-400',
  Desert_Main: 'text-yellow-400',
  Savage_Main: 'text-emerald-400',
  Tiger_Main: 'text-orange-400',
  Kiki_Main: 'text-blue-400',
  Vikendi_Main: 'text-cyan-400',
  Chimera_Main: 'text-purple-400',
  Heaven_Main: 'text-red-400',
  Neon_Main: 'text-pink-400',
  DihoroV2_Main: 'text-amber-400',
}

function getMapName(key: string): string {
  return MAP_NAMES[key] ?? key.replace('_Main', '')
}

function getMapColor(key: string): string {
  return MAP_COLORS[key] ?? 'bg-zinc-500/70'
}

function getMapTextColor(key: string): string {
  return MAP_TEXT_COLORS[key] ?? 'text-zinc-400'
}

function getBestMap(stats: MapStat[]): MapStat | null {
  if (stats.length === 0) return null
  // 게임 수 3 이상인 맵 중 평균 킬 기준, 없으면 전체에서 선택
  const qualified = stats.filter((s) => s.games >= 3)
  const pool = qualified.length > 0 ? qualified : stats
  return pool.reduce((best, cur) => (cur.avgKills > best.avgKills ? cur : best), pool[0]!)
}

export function MapView({ mapStats, totalGames }: Props) {
  if (mapStats.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400">
        <span className="text-2xl">🗺️</span>
        <span className="text-sm">매치 데이터가 없습니다</span>
      </div>
    )
  }

  const bestMap = getBestMap(mapStats)
  const maxKills = Math.max(...mapStats.map((s) => s.avgKills), 0.1)

  // 전체 이동 거리 평균
  const totalFootAvg = totalGames > 0
    ? mapStats.reduce((sum, s) => sum + s.avgFootDistance * s.games, 0) / totalGames
    : 0
  const totalVehicleAvg = totalGames > 0
    ? mapStats.reduce((sum, s) => sum + s.avgVehicleDistance * s.games, 0) / totalGames
    : 0
  const maxMovement = Math.max(totalFootAvg, totalVehicleAvg, 1)

  return (
    <div className="space-y-6">
      {/* 강점 맵 + 요약 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-1 text-xs text-zinc-500">강점 맵</p>
          {bestMap ? (
            <>
              <p className={`text-lg font-bold ${getMapTextColor(bestMap.mapName)}`}>
                {getMapName(bestMap.mapName)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                평균 {bestMap.avgKills.toFixed(1)}킬 · {bestMap.games}게임
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">데이터 없음</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-1 text-xs text-zinc-500">분석 게임 수</p>
          <p className="text-lg font-bold text-white">{totalGames}게임</p>
          <p className="mt-1 text-xs text-zinc-400">{mapStats.length}개 맵</p>
        </div>
      </div>

      {/* 맵별 카드 그리드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mapStats.map((s) => (
          <div
            key={s.mapName}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-sm font-bold ${getMapTextColor(s.mapName)}`}>
                {getMapName(s.mapName)}
              </span>
              <span className="text-xs text-zinc-500">{s.games}게임</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold text-white">{s.avgKills.toFixed(1)}</p>
                <p className="text-[10px] text-zinc-500">평균킬</p>
              </div>
              <div>
                <p className="text-base font-bold text-white">{Math.round(s.avgDamage)}</p>
                <p className="text-[10px] text-zinc-500">평균딜</p>
              </div>
              <div>
                <p className="text-base font-bold text-white">
                  {s.wins > 0 ? `${(s.winRate * 100).toFixed(0)}%` : '—'}
                </p>
                <p className="text-[10px] text-zinc-500">승률</p>
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-zinc-500">평균 순위 {s.avgPlacement.toFixed(1)}위</p>
            </div>
          </div>
        ))}
      </div>

      {/* 맵별 평균 킬 바 차트 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">맵별 평균 킬</h3>
        <div className="space-y-3">
          {mapStats.map((s) => (
            <div key={s.mapName} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={`font-medium ${getMapTextColor(s.mapName)}`}>
                  {getMapName(s.mapName)}
                </span>
                <span className="text-zinc-400">{s.avgKills.toFixed(2)}킬</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${getMapColor(s.mapName)}`}
                  style={{ width: `${Math.round((s.avgKills / maxKills) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이동 패턴 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">평균 이동 패턴 (전체)</h3>
        <div className="space-y-3">
          {[
            { label: '도보 이동', value: totalFootAvg, color: 'bg-green-500/70', textColor: 'text-green-400' },
            { label: '차량 이동', value: totalVehicleAvg, color: 'bg-blue-500/70', textColor: 'text-blue-400' },
          ].map(({ label, value, color, textColor }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={`font-medium ${textColor}`}>{label}</span>
                <span className="text-zinc-400">{Math.round(value).toLocaleString()}m</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${color}`}
                  style={{ width: `${Math.round((value / maxMovement) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-600">최근 {totalGames}게임 기준</p>
      </div>
    </div>
  )
}
