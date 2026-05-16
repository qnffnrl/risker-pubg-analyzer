import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type StatColor = 'default' | 'aggression' | 'survival' | 'positioning' | 'teamplay'
type TrendDirection = 'up' | 'down' | 'neutral'

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: TrendDirection
  color?: StatColor
  className?: string
}

const COLOR_MAP: Record<StatColor, string> = {
  default: 'text-foreground',
  aggression: 'text-aggression',
  survival: 'text-survival',
  positioning: 'text-positioning',
  teamplay: 'text-teamplay',
}

const BORDER_MAP: Record<StatColor, string> = {
  default: 'border-border',
  aggression: 'border-aggression/30',
  survival: 'border-survival/30',
  positioning: 'border-positioning/30',
  teamplay: 'border-teamplay/30',
}

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  color = 'default',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-colors hover:bg-card-hover ${BORDER_MAP[color]} ${className}`}
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className={`text-2xl font-bold tabular-nums ${COLOR_MAP[color]}`}>
          {value}
        </span>
        {trend && (
          <span className="mb-0.5 flex items-center gap-1">
            <TrendIcon trend={trend} />
          </span>
        )}
      </div>
      {subValue && (
        <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>
      )}
    </div>
  )
}
