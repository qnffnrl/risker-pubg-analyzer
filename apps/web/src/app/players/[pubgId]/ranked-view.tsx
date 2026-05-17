'use client'

import { useState } from 'react'
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

const TIER_BG: Record<string, string> = {
  Bronze: 'bg-amber-700/20 border-amber-700/40',
  Silver: 'bg-zinc-400/20 border-zinc-400/40',
  Gold: 'bg-yellow-400/20 border-yellow-400/40',
  Platinum: 'bg-cyan-400/20 border-cyan-400/40',
  Diamond: 'bg-blue-400/20 border-blue-400/40',
  Master: 'bg-purple-400/20 border-purple-400/40',
  Unranked: 'bg-zinc-700/20 border-zinc-700/40',
}

const TIER_ICONS: Record<string, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '🔵',
  Diamond: '💎',
  Master: '👑',
  Unranked: '—',
}

const MODE_LABELS: Record<string, string> = {
  squad: 'SQUAD (TPP)',
  'squad-fpp': 'SQUAD (FPP)',
  duo: 'DUO (TPP)',
  'duo-fpp': 'DUO (FPP)',
  solo: 'SOLO (TPP)',
  'solo-fpp': 'SOLO (FPP)',
}

function TierBadge({ tier }: { tier: RankedTier }) {
  const tierName = tier.tier === 'Unranked' || !tier.tier ? 'Unranked' : tier.tier
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${TIER_BG[tierName] ?? TIER_BG['Unranked']}`}>
      <span>{TIER_ICONS[tierName] ?? '—'}</span>
      <span className={TIER_COLORS[tierName] ?? 'text-zinc-500'}>
        {tierName === 'Unranked' ? 'Unranked' : `${tierName} ${tier.subTier}`}
      </span>
    </span>
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
