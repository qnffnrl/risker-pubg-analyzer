'use client'
import { useState } from 'react'
import { getTopDeathZones } from '@/lib/maps'

interface MapHeatmapPoints {
  mapName: string
  kills: Array<[number, number]>
  deaths: Array<[number, number]>
}

interface MapHeatmapProps {
  mapName: string
  data: MapHeatmapPoints
}

export function MapHeatmap({ mapName, data }: MapHeatmapProps) {
  const [showKills, setShowKills] = useState(true)
  const [showDeaths, setShowDeaths] = useState(true)

  const topDeaths = getTopDeathZones(data.deaths, mapName)

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-square bg-neutral-800 rounded-lg overflow-hidden">
        {/* Map background — neutral grid pattern */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-neutral-500" />
          ))}
        </div>

        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        >
          {showKills && data.kills.map(([x, y], i) => (
            <circle
              key={`k-${i}`}
              cx={x * 1000}
              cy={y * 1000}
              r={5}
              fill="#22c55e"
              opacity={0.6}
            />
          ))}
          {showDeaths && data.deaths.map(([x, y], i) => (
            <circle
              key={`d-${i}`}
              cx={x * 1000}
              cy={y * 1000}
              r={5}
              fill="#ef4444"
              opacity={0.6}
            />
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showKills} onChange={e => setShowKills(e.target.checked)} className="rounded" />
          <span className="text-green-400">킬 {data.kills.length}개</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showDeaths} onChange={e => setShowDeaths(e.target.checked)} className="rounded" />
          <span className="text-red-400">데스 {data.deaths.length}회</span>
        </label>
      </div>

      {topDeaths.length > 0 && (
        <div className="border border-neutral-800 rounded-lg p-3">
          <p className="text-xs font-medium text-neutral-400 mb-2">자주 죽는 지역 Top {topDeaths.length}</p>
          <ol className="space-y-1">
            {topDeaths.map((z, i) => (
              <li key={z.name} className="flex items-center gap-2 text-sm">
                <span className="text-neutral-500">{i + 1}.</span>
                <span className="text-white">{z.name} 인근</span>
                <span className="text-red-400 ml-auto">{z.count}회 사망</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
