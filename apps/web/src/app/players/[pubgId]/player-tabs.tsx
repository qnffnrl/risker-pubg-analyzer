'use client'

import { useState } from 'react'
import type { MatchStat, WeaponStatsData, MapStatsData, RankedStatsData } from '@/lib/api'
import { MatchList } from './match-list'
import { WeaponView } from './weapon-view'
import { MapView } from './map-view'
import { TrendView } from './trend-view'
import { RankedView } from './ranked-view'

interface Props {
  pubgId: string
  initialMatches: MatchStat[]
  weaponStats: WeaponStatsData | null
  mapStats: MapStatsData | null
  rankedStats: RankedStatsData | null
}

const TABS = ['전적', '무기', '맵', '추이', '랭크'] as const
type Tab = (typeof TABS)[number]

export function PlayerTabs({ pubgId, initialMatches, weaponStats, mapStats, rankedStats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('전적')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === '전적' && (
        <MatchList initialMatches={initialMatches} pubgId={pubgId} />
      )}
      {activeTab === '무기' && (
        <WeaponView
          weaponData={weaponStats?.weaponData ?? null}
          fetchedAt={weaponStats?.fetchedAt ?? null}
        />
      )}
      {activeTab === '맵' && (
        <MapView
          mapStats={mapStats?.mapStats ?? []}
          totalGames={mapStats?.totalGames ?? 0}
        />
      )}
      {activeTab === '추이' && (
        <TrendView matches={initialMatches} />
      )}
      {activeTab === '랭크' && (
        <RankedView
          rankedData={rankedStats?.rankedData ?? {}}
          seasonId={rankedStats?.seasonId ?? ''}
        />
      )}
    </div>
  )
}
