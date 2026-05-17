'use client'

import { useState, useEffect, useMemo } from 'react'
import type { MatchStat } from '@/lib/api'

export type ModeFilter = 'all' | 'squad' | 'squad-fpp' | 'duo' | 'duo-fpp' | 'solo' | 'solo-fpp'
export type MapFilter = 'all' | 'Baltic_Main' | 'Desert_Main' | 'Savage_Main' | 'Tiger_Main' | 'Kiki_Main' | 'DihorOtok_Main' | 'Neon_Main' | 'Summerland_Main' | 'Chimera_Main'
export type PeriodFilter = '10' | '20' | '50'

export function useMatchFilter(matches: MatchStat[]) {
  const [mode, setMode] = useState<ModeFilter>('all')
  const [map, setMap] = useState<MapFilter>('all')
  const [period, setPeriod] = useState<PeriodFilter>('20')

  // Read initial values from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const m = p.get('mode') as ModeFilter | null
    const mp = p.get('map') as MapFilter | null
    const pe = p.get('period') as PeriodFilter | null
    if (m) setMode(m)
    if (mp) setMap(mp)
    if (pe) setPeriod(pe)
  }, [])

  // Sync filter changes to URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    if (mode === 'all') p.delete('mode'); else p.set('mode', mode)
    if (map === 'all') p.delete('map'); else p.set('map', map)
    if (period === '20') p.delete('period'); else p.set('period', period)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [mode, map, period])

  const filteredMatches = useMemo(() => {
    // Sort newest first
    const sorted = [...matches].sort((a, b) =>
      (b.playedAt ?? '').localeCompare(a.playedAt ?? ''),
    )
    // Period slice
    const n = Number(period)
    const periodSliced = sorted.slice(0, n)
    // Mode filter
    const modeFiltered = mode === 'all' ? periodSliced : periodSliced.filter((m) => m.mode === mode)
    // Map filter
    return map === 'all' ? modeFiltered : modeFiltered.filter((m) => m.mapName === map)
  }, [matches, mode, map, period])

  return { mode, map, period, setMode, setMap, setPeriod, filteredMatches }
}
