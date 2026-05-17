'use client'

import type { ModeFilter, MapFilter, PeriodFilter } from '@/lib/hooks/use-match-filter'

interface Props {
  mode: ModeFilter
  map: MapFilter
  period: PeriodFilter
  setMode: (v: ModeFilter) => void
  setMap: (v: MapFilter) => void
  setPeriod: (v: PeriodFilter) => void
}

const MODE_OPTIONS: { value: ModeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'squad', label: 'SQUAD' },
  { value: 'squad-fpp', label: 'SQUAD FPP' },
  { value: 'duo', label: 'DUO' },
  { value: 'duo-fpp', label: 'DUO FPP' },
  { value: 'solo', label: 'SOLO' },
  { value: 'solo-fpp', label: 'SOLO FPP' },
]

const MAP_OPTIONS: { value: MapFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'Baltic_Main', label: '에란겔' },
  { value: 'Desert_Main', label: '미라마' },
  { value: 'Savage_Main', label: '사녹' },
  { value: 'Tiger_Main', label: '태이고' },
  { value: 'Kiki_Main', label: '데스톤' },
  { value: 'DihorOtok_Main', label: '비켄디' },
  { value: 'Neon_Main', label: '론도' },
  { value: 'Summerland_Main', label: '카라킨' },
  { value: 'Chimera_Main', label: '파라모' },
]

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '10', label: '최근 10게임' },
  { value: '20', label: '최근 20게임' },
  { value: '50', label: '최근 50게임' },
]

const selectCls = 'rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-primary cursor-pointer'

export function MatchFilterBar({ mode, map, period, setMode, setMap, setPeriod }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 overflow-x-auto pb-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 whitespace-nowrap">모드</span>
        <select className={selectCls} value={mode} onChange={(e) => setMode(e.target.value as ModeFilter)}>
          {MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 whitespace-nowrap">맵</span>
        <select className={selectCls} value={map} onChange={(e) => setMap(e.target.value as MapFilter)}>
          {MAP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 whitespace-nowrap">기간</span>
        <select className={selectCls} value={period} onChange={(e) => setPeriod(e.target.value as PeriodFilter)}>
          {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  )
}
