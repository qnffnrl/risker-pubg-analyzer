import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/** 기본 스켈레톤 블록 */
function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-secondary/70',
        className,
      )}
    />
  )
}

/** StatCard 스켈레톤 */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="mt-1 h-3 w-16" />
    </div>
  )
}

/** PlayerCard 스켈레톤 */
export function PlayerCardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-4',
        className,
      )}
    >
      {/* 아바타 */}
      <Skeleton className="h-10 w-10 rounded-full" />
      {/* 텍스트 */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      {/* 배지 */}
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

/** RadarChart 스켈레톤 */
export function RadarChartSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl border border-border bg-card',
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* 동심원 모양 placeholder */}
        {[96, 64, 32].map((size) => (
          <div
            key={size}
            className="absolute animate-pulse rounded-full border border-secondary/50"
            style={{ width: size, height: size }}
          />
        ))}
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  )
}

/** 텍스트 줄 스켈레톤 */
export function TextLineSkeleton({ lines = 3, className }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
