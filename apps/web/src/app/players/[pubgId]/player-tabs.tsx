'use client'

import { useState } from 'react'
import type { MatchStat, WeaponStatsData, MapStatsData, RankedStatsData, AnalysisData } from '@/lib/api'
import { useMatchFilter } from '@/lib/hooks/use-match-filter'
import { MatchFilterBar } from '@/components/match-filter-bar'
import { MapHeatmap } from '@/components/heatmap/MapHeatmap'
import { MAP_DISPLAY_NAMES } from '@/lib/maps'
import { MatchList } from './match-list'
import { WeaponView } from './weapon-view'
import { MapView } from './map-view'
import { TrendView } from './trend-view'
import { RankedView } from './ranked-view'
import { ModeComparisonCard } from './mode-comparison-card'

interface Props {
  pubgId: string
  initialMatches: MatchStat[]
  weaponStats: WeaponStatsData | null
  mapStats: MapStatsData | null
  rankedStats: RankedStatsData | null
  analysis: AnalysisData | null
}

const TABS = ['전적', '무기', '맵', '추이', '랭크', '히트맵'] as const
type Tab = (typeof TABS)[number]

export function PlayerTabs({ pubgId, initialMatches, weaponStats, mapStats, rankedStats, analysis }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('전적')
  const [allMatches, setAllMatches] = useState<MatchStat[]>(initialMatches)
  const { mode, map, period, setMode, setMap, setPeriod, filteredMatches } = useMatchFilter(allMatches)

  function handleLoadMore(newMatches: MatchStat[]) {
    setAllMatches((prev) => [...prev, ...newMatches])
  }

  return (
    <div className="space-y-4">
      {/* 모드별 비교 카드 */}
      <ModeComparisonCard matches={allMatches} />

      {/* 필터 바 */}
      <MatchFilterBar mode={mode} map={map} period={period} setMode={setMode} setMap={setMap} setPeriod={setPeriod} />

      {/* 탭 */}
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
        <MatchList
          initialMatches={filteredMatches}
          pubgId={pubgId}
          onLoadMore={handleLoadMore}
          totalLoaded={allMatches.length}
        />
      )}
      {activeTab === '무기' && (
        <WeaponView weaponData={weaponStats?.weaponData ?? null} fetchedAt={weaponStats?.fetchedAt ?? null} />
      )}
      {activeTab === '맵' && (
        <MapView mapStats={mapStats?.mapStats ?? []} totalGames={mapStats?.totalGames ?? 0} />
      )}
      {activeTab === '추이' && (
        <TrendView matches={filteredMatches} />
      )}
      {activeTab === '랭크' && (
        <RankedView rankedData={rankedStats?.rankedData ?? {}} seasonId={rankedStats?.seasonId ?? ''} />
      )}
      {activeTab === '히트맵' && (
        <div className="space-y-6">
          {!analysis?.heatmapData || Object.keys(analysis.heatmapData).length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p>히트맵 데이터를 수집 중입니다.</p>
              <p className="text-sm mt-1">텔레메트리 수집 완료 후 분석을 새로고침하면 표시됩니다.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-500">수집된 전체 매치의 킬·데스 위치를 맵별로 표시합니다.</p>
              {Object.entries(analysis.heatmapData).map(([mapName, data]) => (
                <div key={mapName} className="space-y-3">
                  <h3 className="font-semibold text-white">
                    {MAP_DISPLAY_NAMES[mapName] ?? mapName.replace('_Main', '')}
                    <span className="text-sm font-normal text-neutral-400 ml-2">킬 {data.kills.length} / 데스 {data.deaths.length}</span>
                  </h3>
                  <MapHeatmap mapName={mapName} data={data} />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
