import type { MatchStat } from '@/lib/api'

const BASE_MODE_LABELS: Record<string, string> = {
  squad: '스쿼드',
  duo: '듀오',
  solo: '솔로',
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export function ModeComparisonCard({ matches }: { matches: MatchStat[] }) {
  // Group by base mode (strip -fpp)
  const grouped: Record<string, MatchStat[]> = {}
  for (const m of matches) {
    const base = (m.mode ?? 'unknown').replace('-fpp', '')
    if (!grouped[base]) grouped[base] = []
    grouped[base]!.push(m)
  }

  const modes = Object.keys(grouped).filter((k) => BASE_MODE_LABELS[k] && grouped[k]!.length >= 1)
  if (modes.length < 2) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">모드별 비교</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {modes.map((mode) => {
          const ms = grouped[mode]!
          const avgKills = avg(ms.map((m) => m.kills ?? 0))
          const avgDmg = avg(ms.map((m) => parseFloat(m.damageDealt ?? '0')))
          const avgPlace = avg(ms.map((m) => m.placement ?? 99))
          const winRate = (ms.filter((m) => m.placement === 1).length / ms.length) * 100
          return (
            <div key={mode} className="min-w-[110px] flex-1 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3 text-center">
              <p className="mb-2 text-xs font-semibold text-zinc-300">{BASE_MODE_LABELS[mode]}</p>
              <p className="text-[10px] text-zinc-500">{ms.length}게임</p>
              <div className="mt-2 space-y-1 text-left">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">킬</span>
                  <span className="font-medium text-white">{avgKills.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">데미지</span>
                  <span className="font-medium text-white">{Math.round(avgDmg)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">평균순위</span>
                  <span className="font-medium text-white">#{avgPlace.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">승률</span>
                  <span className="font-medium text-white">{winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
