'use client'
import { useState } from 'react'
import type { WeaknessFinding } from '@/lib/api'

function severityColor(s: number) {
  if (s >= 0.7) return 'bg-red-500'
  if (s >= 0.4) return 'bg-orange-500'
  return 'bg-yellow-500'
}

function severityLabel(s: number) {
  if (s >= 0.7) return { text: '긴급', cls: 'bg-red-500/20 text-red-400' }
  if (s >= 0.4) return { text: '주의', cls: 'bg-orange-500/20 text-orange-400' }
  return { text: '관찰', cls: 'bg-yellow-500/20 text-yellow-400' }
}

export function WeaknessCard({ weakness }: { weakness: WeaknessFinding }) {
  const [open, setOpen] = useState(false)
  const label = severityLabel(weakness.severity)
  return (
    <div className="relative flex overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      <div className={`w-1 shrink-0 ${severityColor(weakness.severity)}`} />
      <div className="flex-1 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400">이번 분석에서 가장 큰 누수</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${label.cls}`}>{label.text}</span>
        </div>
        <p className="font-semibold text-white">{weakness.ruleName}</p>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          {open ? '▲ 근거 숨기기' : '▼ 근거 보기'}
        </button>
        {open && (
          <div className="text-xs text-neutral-400 bg-neutral-800 rounded p-2 space-y-0.5">
            <div>
              <span className="font-medium">{weakness.evidence.metric}</span>: {weakness.evidence.value}
            </div>
            <div>임계값: {weakness.evidence.threshold}</div>
            {weakness.evidence.matchesAffected !== undefined && (
              <div className="text-neutral-500">{weakness.evidence.matchesAffected}게임 해당</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
