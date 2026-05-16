'use client'

import { useState } from 'react'
import type { MatchStat, WeaponStatsData } from '@/lib/api'
import { MatchList } from './match-list'
import { WeaponView } from './weapon-view'

interface Props {
  pubgId: string
  initialMatches: MatchStat[]
  weaponStats: WeaponStatsData | null
}

const TABS = ['전적', '무기'] as const
type Tab = (typeof TABS)[number]

export function PlayerTabs({ pubgId, initialMatches, weaponStats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('전적')

  return (
    <div className="space-y-4">
      {/* Tab header */}
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

      {/* Tab content */}
      {activeTab === '전적' && (
        <MatchList initialMatches={initialMatches} pubgId={pubgId} />
      )}
      {activeTab === '무기' && (
        <WeaponView
          weaponData={weaponStats?.weaponData ?? null}
          fetchedAt={weaponStats?.fetchedAt ?? null}
        />
      )}
    </div>
  )
}
