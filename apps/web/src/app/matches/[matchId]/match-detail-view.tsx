'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Crown, Copy, Check, ArrowLeft } from 'lucide-react'
import type { MatchDetailData, MatchParticipant, ParticipantStats } from '@/lib/api'

const MAP_NAMES: Record<string, string> = {
  Baltic_Main: '에란겔',
  Desert_Main: '미라마',
  Savage_Main: '사녹',
  DihorOtok_Main: '비켄디',
  Erangel_Main: '에란겔',
  Tiger_Main: '태이고',
  Kiki_Main: '데스톤',
  Neon_Main: '론도',
  Summerland_Main: '카라킨',
  Chimera_Main: '파라모',
}

const MODE_LABELS: Record<string, string> = {
  squad: 'SQUAD',
  'squad-fpp': 'SQUAD FPP',
  duo: 'DUO',
  'duo-fpp': 'DUO FPP',
  solo: 'SOLO',
  'solo-fpp': 'SOLO FPP',
  'normal-squad': 'SQUAD (일반)',
  'normal-duo': 'DUO (일반)',
  'normal-solo': 'SOLO (일반)',
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`
}

type SortKey = 'winPlace' | 'kills' | 'damageDealt'

interface Props {
  data: MatchDetailData
  pubgId?: string
}

export function MatchDetailView({ data, pubgId }: Props) {
  const { match, participants, rosters, telemetryUrl } = data
  const [sortKey, setSortKey] = useState<SortKey>('winPlace')
  const [copied, setCopied] = useState(false)

  const mapLabel = MAP_NAMES[match.mapName ?? ''] ?? match.mapName ?? '알 수 없음'
  const modeLabel = MODE_LABELS[match.mode ?? ''] ?? (match.mode?.toUpperCase() ?? '-')
  const playedAt = match.playedAt
    ? new Date(match.playedAt).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '-'
  const durationMin = match.durationSec ? Math.floor(match.durationSec / 60) : null

  // Build participant map (id → stats)
  const participantMap = new Map<string, MatchParticipant>(participants.map((p) => [p.id, p]))

  // Find "my" participant by pubgId (which is the PUBG account ID stored in stats.playerId)
  const myParticipant = pubgId
    ? participants.find((p) => p.stats.playerId === pubgId)
    : null

  // Sort participants
  const sorted = [...participants].sort((a, b) => {
    if (sortKey === 'winPlace') return a.stats.winPlace - b.stats.winPlace
    if (sortKey === 'kills') return b.stats.kills - a.stats.kills
    return b.stats.damageDealt - a.stats.damageDealt
  })

  async function handleCopy() {
    if (!telemetryUrl) return
    await navigator.clipboard.writeText(telemetryUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* 뒤로 가기 */}
        <Link
          href={pubgId ? `/players/${encodeURIComponent(pubgId)}` : '/'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>

        {/* 매치 헤더 */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {mapLabel}
              </span>
              <span className="text-sm text-muted-foreground">{modeLabel}</span>
              {durationMin !== null && (
                <span className="text-sm text-muted-foreground">{durationMin}분</span>
              )}
              {match.totalPlayers !== null && (
                <span className="text-sm text-muted-foreground">{match.totalPlayers}명</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{playedAt}</span>
          </div>
        </div>

        {/* 나의 스탯 하이라이트 */}
        {myParticipant && (
          <MyStats stats={myParticipant.stats} />
        )}

        {/* 팀 순위표 */}
        <TeamTable rosters={rosters} participantMap={participantMap} myPubgId={pubgId} />

        {/* 전체 참가자 테이블 */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">전체 참가자</h2>
            <div className="flex gap-1.5">
              {(['winPlace', 'kills', 'damageDealt'] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    sortKey === key ? 'bg-primary text-primary-foreground' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {key === 'winPlace' ? '순위' : key === 'kills' ? '킬' : '데미지'}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <ParticipantsTable participants={sorted} myPubgId={pubgId} />
          </div>
        </div>

        {/* 텔레메트리 URL */}
        {telemetryUrl && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-xs text-muted-foreground">텔레메트리 URL</p>
                <p className="truncate text-xs text-foreground">{telemetryUrl}</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MyStats({ stats }: { stats: ParticipantStats }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="mb-3 text-xs font-semibold text-primary">나의 스탯</p>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        <div className="col-span-1 flex flex-col items-center">
          {stats.winPlace === 1 && <Crown className="mb-0.5 h-4 w-4 text-amber-400" />}
          <span className={`text-xl font-bold tabular-nums ${stats.winPlace === 1 ? 'text-amber-400' : 'text-foreground'}`}>
            #{stats.winPlace}
          </span>
          <span className="text-[10px] text-muted-foreground">순위</span>
        </div>
        <MiniStat label="킬" value={stats.kills} />
        <MiniStat label="어시" value={stats.assists} />
        <MiniStat label="데미지" value={Math.round(stats.damageDealt)} />
        <MiniStat label="생존" value={formatTime(stats.timeSurvived)} />
        <MiniStat label="헤드샷" value={stats.headshotKills} />
        <MiniStat label="도보" value={formatDist(stats.walkDistance)} />
        <MiniStat label="차량" value={formatDist(stats.rideDistance)} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function TeamTable({
  rosters,
  participantMap,
  myPubgId,
}: {
  rosters: MatchDetailData['rosters']
  participantMap: Map<string, MatchParticipant>
  myPubgId?: string
}) {
  const myTeam = myPubgId
    ? rosters.find((r) =>
        r.participantIds.some((pid) => participantMap.get(pid)?.stats.playerId === myPubgId),
      )
    : null

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">팀 순위</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">순위</th>
              <th className="px-4 py-2 text-right font-medium">킬 합산</th>
              <th className="px-4 py-2 text-left font-medium">플레이어</th>
            </tr>
          </thead>
          <tbody>
            {rosters.slice(0, 20).map((roster) => {
              const members = roster.participantIds
                .map((id) => participantMap.get(id))
                .filter(Boolean) as MatchParticipant[]
              const totalKills = members.reduce((s, p) => s + p.stats.kills, 0)
              const isMyTeam = myTeam?.id === roster.id
              return (
                <tr
                  key={roster.id}
                  className={`border-b border-border/50 transition-colors ${isMyTeam ? 'bg-primary/5' : 'hover:bg-zinc-900/40'}`}
                >
                  <td className={`px-4 py-2 font-semibold tabular-nums ${roster.rank === 1 ? 'text-amber-400' : 'text-foreground'}`}>
                    {roster.rank === 1 && <Crown className="mb-0.5 mr-1 inline h-3 w-3 text-amber-400" />}
                    #{roster.rank}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-foreground">{totalKills}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {members.map((p, i) => (
                      <span key={p.id}>
                        <span className={p.stats.playerId === myPubgId ? 'font-semibold text-primary' : ''}>
                          {p.stats.name}
                        </span>
                        {i < members.length - 1 && ', '}
                      </span>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ParticipantsTable({
  participants,
  myPubgId,
}: {
  participants: MatchParticipant[]
  myPubgId?: string
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          <th className="px-4 py-2 text-left font-medium">닉네임</th>
          <th className="px-4 py-2 text-right font-medium">순위</th>
          <th className="px-4 py-2 text-right font-medium">킬</th>
          <th className="px-4 py-2 text-right font-medium">데미지</th>
          <th className="px-4 py-2 text-right font-medium hidden sm:table-cell">생존</th>
          <th className="px-4 py-2 text-right font-medium hidden sm:table-cell">도보</th>
          <th className="px-4 py-2 text-right font-medium hidden md:table-cell">차량</th>
        </tr>
      </thead>
      <tbody>
        {participants.map((p) => {
          const isMe = p.stats.playerId === myPubgId
          return (
            <tr
              key={p.id}
              className={`border-b border-border/50 transition-colors ${isMe ? 'bg-primary/5 font-semibold' : 'hover:bg-zinc-900/40'}`}
            >
              <td className={`px-4 py-2 ${isMe ? 'text-primary' : 'text-foreground'}`}>
                {p.stats.name}
              </td>
              <td className={`px-4 py-2 text-right tabular-nums ${p.stats.winPlace === 1 ? 'text-amber-400 font-bold' : 'text-muted-foreground'}`}>
                #{p.stats.winPlace}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-foreground">{p.stats.kills}</td>
              <td className="px-4 py-2 text-right tabular-nums text-foreground">{Math.round(p.stats.damageDealt)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                {formatTime(p.stats.timeSurvived)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                {formatDist(p.stats.walkDistance)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                {formatDist(p.stats.rideDistance)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
