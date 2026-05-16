interface StyleScoreBarsProps {
  aggression: number
  survival: number
  positioning: number
  teamplay: number
}

const TRAITS = [
  { key: 'aggression', label: '공격성', color: 'bg-rose-400' },
  { key: 'survival', label: '생존형', color: 'bg-emerald-400' },
  { key: 'positioning', label: '포지셔닝', color: 'bg-blue-400' },
  { key: 'teamplay', label: '팀플레이', color: 'bg-amber-400' },
] as const

export function StyleScoreBars({ aggression, survival, positioning, teamplay }: StyleScoreBarsProps) {
  const scores = { aggression, survival, positioning, teamplay }

  return (
    <div className="space-y-2.5">
      {TRAITS.map(({ key, label, color }) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold tabular-nums text-foreground">{scores[key].toFixed(1)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${color} transition-all duration-500`}
              style={{ width: `${Math.min(scores[key], 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
