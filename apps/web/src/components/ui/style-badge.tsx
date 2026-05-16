/** 플레이 성향 타입 */
export type PlayStyleType =
  | '러셔'
  | '존버형'
  | '서클 마스터'
  | '팀플레이어'
  | '스나이퍼'
  | '올라운더'
  | '분석중'

interface StyleBadgeProps {
  style: PlayStyleType
  className?: string
}

const STYLE_CONFIG: Record<
  PlayStyleType,
  { label: string; colorClass: string }
> = {
  러셔: {
    label: '러셔',
    colorClass:
      'text-aggression border-aggression/30 bg-aggression/10',
  },
  존버형: {
    label: '존버형',
    colorClass:
      'text-survival border-survival/30 bg-survival/10',
  },
  '서클 마스터': {
    label: '서클 마스터',
    colorClass:
      'text-positioning border-positioning/30 bg-positioning/10',
  },
  팀플레이어: {
    label: '팀플레이어',
    colorClass:
      'text-teamplay border-teamplay/30 bg-teamplay/10',
  },
  스나이퍼: {
    label: '스나이퍼',
    colorClass:
      'text-primary border-primary/30 bg-primary/10',
  },
  올라운더: {
    label: '올라운더',
    colorClass:
      'text-foreground border-border/50 bg-secondary',
  },
  분석중: {
    label: '분석중',
    colorClass:
      'text-muted-foreground border-border/30 bg-muted/50',
  },
}

export function StyleBadge({ style, className = '' }: StyleBadgeProps) {
  const config = STYLE_CONFIG[style]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${config.colorClass} ${className}`}
    >
      {config.label}
    </span>
  )
}
