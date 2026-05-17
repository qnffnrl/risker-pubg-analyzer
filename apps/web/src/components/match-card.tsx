import Link from 'next/link'
import { Crown } from 'lucide-react'
import type { MatchStat } from '@/lib/api'

function formatTime(sec: number | null): string {
  if (!sec) return '-'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDist(val: string | null): string {
  if (!val) return '-'
  const n = Math.round(Number(val))
  return n >= 1000 ? `${(n / 1000).toFixed(1)}km` : `${n}m`
}

function placementColor(place: number | null, total: number | null): string {
  if (!place) return 'text-muted-foreground'
  if (place === 1) return 'text-amber-400'
  if (total && place <= Math.ceil(total * 0.1)) return 'text-primary'
  return 'text-muted-foreground'
}

const MODE_BADGE: Record<string, string> = {
  squad: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'squad-fpp': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  duo: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'duo-fpp': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  solo: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'solo-fpp': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

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

interface MatchCardProps {
  match: MatchStat
  pubgId?: string
}

export function MatchCard({ match, pubgId }: MatchCardProps) {
  const modeBadge = MODE_BADGE[match.mode ?? ''] ?? 'bg-secondary text-muted-foreground border-border'
  const mapLabel = MAP_NAMES[match.mapName ?? ''] ?? match.mapName ?? '알 수 없음'
  const modeLabel = match.mode?.toUpperCase().replace('-', ' ') ?? '-'
  const placeColor = placementColor(match.placement, match.totalPlayers)
  const playedAt = match.playedAt ? new Date(match.playedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
  const detailHref = pubgId
    ? `/matches/${match.matchId}?player=${encodeURIComponent(pubgId)}`
    : `/matches/${match.matchId}`

  return (
    <Link href={detailHref} className="block">
      <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80">
        {/* 헤더 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${modeBadge}`}>{modeLabel}</span>
            <span className="text-sm font-medium text-foreground">{mapLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{playedAt}</span>
            <span className="text-xs text-primary/60">상세 →</span>
          </div>
        </div>

        {/* 주요 스탯 */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {/* 순위 */}
          <div className="col-span-1 flex flex-col items-center">
            {match.placement === 1 && <Crown className="mb-0.5 h-4 w-4 text-amber-400" />}
            <span className={`text-xl font-bold tabular-nums ${placeColor}`}>
              #{match.placement ?? '-'}
            </span>
            <span className="text-[10px] text-muted-foreground">순위</span>
          </div>

          <Stat label="킬" value={match.kills ?? 0} />
          <Stat label="어시" value={match.assists ?? 0} />
          <Stat label="데미지" value={Math.round(Number(match.damageDealt ?? 0))} />
          <Stat label="생존" value={formatTime(match.timeSurvived)} />
          <Stat label="헤드샷" value={match.headshotKills ?? 0} />
          <Stat label="이동" value={formatDist(match.distanceOnFoot)} />
          <Stat label="부스터" value={match.boosts ?? 0} />
        </div>
      </div>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
