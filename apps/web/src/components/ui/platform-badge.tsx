export type Platform = 'steam' | 'kakao' | 'psn' | 'xbox'

interface PlatformBadgeProps {
  platform: Platform
  className?: string
}

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; colorClass: string }
> = {
  steam: {
    label: 'Steam',
    colorClass:
      'text-blue-300 border-blue-400/30 bg-blue-400/10',
  },
  kakao: {
    label: 'Kakao',
    colorClass:
      'text-yellow-300 border-yellow-400/30 bg-yellow-400/10',
  },
  psn: {
    label: 'PS',
    colorClass:
      'text-indigo-300 border-indigo-400/30 bg-indigo-400/10',
  },
  xbox: {
    label: 'Xbox',
    colorClass:
      'text-green-300 border-green-400/30 bg-green-400/10',
  },
}

export function PlatformBadge({ platform, className = '' }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform]

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${config.colorClass} ${className}`}
    >
      {config.label}
    </span>
  )
}
