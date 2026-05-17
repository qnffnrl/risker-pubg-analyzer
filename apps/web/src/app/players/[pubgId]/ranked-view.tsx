'use client'

import React, { useState } from 'react'
import type { RankedModeStats, RankedTier } from '@/lib/api'

interface Props {
  rankedData: Record<string, RankedModeStats>
  seasonId: string
}

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master']

const TIER_COLORS: Record<string, string> = {
  Bronze: 'text-amber-700',
  Silver: 'text-zinc-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Master: 'text-purple-400',
  Unranked: 'text-zinc-500',
}


// PUBG-style tier SVG emblems — hexagonal shield shape with tier-specific design
const TIER_SVG: Record<string, (size: number) => React.ReactNode> = {
  Bronze: (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill="#3d1f0a" stroke="#b45309" strokeWidth="2"/>
      <polygon points="24,9 38,17 38,33 24,41 10,33 10,17" fill="#78350f" stroke="#d97706" strokeWidth="1"/>
      <text x="24" y="29" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold" fontFamily="serif">B</text>
    </svg>
  ),
  Silver: (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill="#1c1c1e" stroke="#9ca3af" strokeWidth="2"/>
      <polygon points="24,9 38,17 38,33 24,41 10,33 10,17" fill="#374151" stroke="#d1d5db" strokeWidth="1"/>
      <text x="24" y="29" textAnchor="middle" fill="#f3f4f6" fontSize="14" fontWeight="bold" fontFamily="serif">S</text>
    </svg>
  ),
  Gold: (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill="#3b2005" stroke="#f59e0b" strokeWidth="2"/>
      <polygon points="24,9 38,17 38,33 24,41 10,33 10,17" fill="#78350f" stroke="#fcd34d" strokeWidth="1"/>
      <text x="24" y="29" textAnchor="middle" fill="#fde68a" fontSize="14" fontWeight="bold" fontFamily="serif">G</text>
    </svg>
  ),
  Platinum: (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill="#0a1f2e" stroke="#06b6d4" strokeWidth="2"/>
      <polygon points="24,9 38,17 38,33 24,41 10,33 10,17" fill="#164e63" stroke="#67e8f9" strokeWidth="1"/>
      <polygon points="24,16 30,20 30,28 24,32 18,28 18,20" fill="none" stroke="#a5f3fc" strokeWidth="1.5"/>
      <text x="24" y="29" textAnchor="middle" fill="#e0f2fe" fontSize="12" fontWeight="bold" fontFamily="serif">P</text>
    </svg>
  ),
  Diamond: (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill="#0d1b3e" stroke="#3b82f6" strokeWidth="2"/>
      <polygon points="24,9 38,17 38,33 24,41 10,33 10,17" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1"/>
      <polygon points="24,13 34,22 24,35 14,22" fill="#bfdbfe" stroke="#eff6ff" strokeWidth="1"/>
      <line x1="14" y1="22" x2="34" y2="22" stroke="#93c5fd" strokeWidth="0.8"/>
      <line x1="24" y1="13" x2="24" y2="35" stroke="#93c5fd" strokeWidth="0.8"/>
    </svg>
  ),
  Master: (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill="#1a0533" stroke="#a855f7" strokeWidth="2"/>
      <polygon points="24,9 38,17 38,33 24,41 10,33 10,17" fill="#3b0764" stroke="#d8b4fe" strokeWidth="1"/>
      {/* crown */}
      <path d="M14 30 L14 20 L19 25 L24 16 L29 25 L34 20 L34 30 Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.8"/>
      <rect x="14" y="30" width="20" height="3" rx="1" fill="#f59e0b"/>
      <circle cx="14" cy="20" r="1.5" fill="#fbbf24"/>
      <circle cx="24" cy="16" r="1.5" fill="#fbbf24"/>
      <circle cx="34" cy="20" r="1.5" fill="#fbbf24"/>
    </svg>
  ),
  Unranked: (s) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill="#18181b" stroke="#52525b" strokeWidth="2"/>
      <text x="24" y="29" textAnchor="middle" fill="#71717a" fontSize="12" fontWeight="bold">?</text>
    </svg>
  ),
}

const MODE_LABELS: Record<string, string> = {
  squad: 'SQUAD (TPP)',
  'squad-fpp': 'SQUAD (FPP)',
  duo: 'DUO (TPP)',
  'duo-fpp': 'DUO (FPP)',
  solo: 'SOLO (TPP)',
  'solo-fpp': 'SOLO (FPP)',
}

function TierEmblem({ tierName, size = 48 }: { tierName: string; size?: number }) {
  const render = TIER_SVG[tierName] ?? TIER_SVG['Unranked']!
  return <>{render(size)}</>
}

function TierBadge({ tier }: { tier: RankedTier }) {
  const tierName = tier.tier === 'Unranked' || !tier.tier ? 'Unranked' : tier.tier
  return (
    <div className="flex items-center gap-3">
      <TierEmblem tierName={tierName} size={52} />
      <div>
        <p className={`text-base font-bold ${TIER_COLORS[tierName] ?? 'text-zinc-500'}`}>
          {tierName === 'Unranked' ? 'Unranked' : `${tierName} ${tier.subTier}`}
        </p>
      </div>
    </div>
  )
}

function TierProgressBar({ tier, rankPoint }: { tier: RankedTier; rankPoint: number }) {
  const tierIdx = TIER_ORDER.indexOf(tier.tier)
  if (tierIdx === -1 || tier.tier === 'Master') return null

  const subTierNum = Number(tier.subTier) || 1
  // Each tier has 5 sub-tiers; RP range roughly 0-500 per sub-tier, 0-2500 per tier
  const totalTiers = TIER_ORDER.length
  const progress = ((tierIdx + (5 - subTierNum) / 5) / totalTiers) * 100

  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
        {TIER_ORDER.map((t) => (
          <span key={t} className={t === tier.tier ? (TIER_COLORS[t] ?? '') : ''}>{t[0]}</span>
        ))}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-zinc-500">{rankPoint.toLocaleString()} RP</p>
    </div>
  )
}

export function RankedView({ rankedData, seasonId }: Props) {
  const availableModes = Object.keys(rankedData).filter(
    (m) => rankedData[m] && (rankedData[m]!.roundsPlayed ?? 0) > 0,
  )

  const defaultMode = availableModes.find((m) => m === 'squad') ?? availableModes[0] ?? 'squad'
  const [activeMode, setActiveMode] = useState(defaultMode)

  if (availableModes.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400">
        <span className="text-2xl">🏆</span>
        <span className="text-sm">랭크 데이터가 없습니다</span>
        <span className="text-xs text-zinc-600">현재 시즌에 랭크 게임을 플레이하지 않았거나 아직 수집 중입니다</span>
        <span className="text-xs text-primary/70">우측 상단 새로고침 버튼으로 최신 데이터를 수집할 수 있습니다</span>
      </div>
    )
  }

  const stats = rankedData[activeMode]
  if (!stats) return null

  // PUBG ranked API returns kda: 0 always — calculate manually
  const calcKda = stats.deaths && stats.deaths > 0
    ? ((stats.kills + (stats.assists ?? 0)) / stats.deaths).toFixed(2)
    : (stats.kills + (stats.assists ?? 0)).toFixed(2)

  // headshotKills/headshotKillRatio are always 0 in ranked API
  const hsRate = stats.headshotKills && stats.headshotKills > 0 && stats.kills > 0
    ? ((stats.headshotKills / stats.kills) * 100).toFixed(1)
    : null

  const shortSeasonId = seasonId.replace('division.bro.', '').replace('pc-', '시즌 ')

  return (
    <div className="space-y-4">
      {/* 모드 토글 */}
      <div className="flex flex-wrap gap-1.5">
        {availableModes.map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeMode === mode
                ? 'bg-primary text-primary-foreground'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {MODE_LABELS[mode] ?? mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 현재 티어 + 최고 티어 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-2 text-xs text-zinc-500">현재 티어</p>
          <TierBadge tier={stats.currentTier} />
          <TierProgressBar tier={stats.currentTier} rankPoint={stats.currentRankPoint} />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-2 text-xs text-zinc-500">최고 티어</p>
          <TierBadge tier={stats.bestTier} />
          <p className="mt-2 text-xs text-zinc-500">{stats.bestRankPoint.toLocaleString()} RP</p>
        </div>
      </div>

      {/* 지표 카드 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '게임 수', value: `${stats.roundsPlayed}` },
          { label: '승률', value: `${(stats.winRatio * 100).toFixed(1)}%` },
          { label: 'KDA', value: calcKda },
          { label: '평균 순위', value: `#${stats.avgRank.toFixed(1)}` },
          { label: '헤드샷률', value: hsRate ? `${hsRate}%` : '—' },
          { label: '데미지/게임', value: stats.roundsPlayed > 0 ? Math.round(stats.damageDealt / stats.roundsPlayed).toLocaleString() : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
            <p className="text-base font-bold text-white">{value}</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* 추가 지표 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">상세 지표</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {[
            { label: '승리', value: `${stats.wins}회` },
            { label: '킬', value: `${stats.kills}킬` },
            { label: '최다 킬', value: stats.roundMostKills ? `${stats.roundMostKills}킬` : '—' },
            { label: '최장 킬', value: stats.longestKill ? `${Math.round(stats.longestKill)}m` : '—' },
            { label: '기절 (DBNO)', value: stats.dBNOs != null ? `${stats.dBNOs}회` : '—' },
            { label: '부활', value: stats.revives != null ? `${stats.revives}회` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b border-zinc-800 py-1.5">
              <span className="text-zinc-500">{label}</span>
              <span className="font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-right text-[10px] text-zinc-600">{shortSeasonId} 기준</p>
    </div>
  )
}
