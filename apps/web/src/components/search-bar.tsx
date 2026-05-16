'use client'

import { useState, type FormEvent } from 'react'
import { PlayerSearchRequestSchema } from '@risker/shared'

const PLATFORMS = [
  { value: 'steam', label: 'Steam' },
  { value: 'kakao', label: 'Kakao' },
  { value: 'psn', label: 'PS' },
  { value: 'xbox', label: 'Xbox' },
] as const

type Platform = (typeof PLATFORMS)[number]['value']

interface SearchBarProps {
  /** compact 모드: 헤더 내 삽입용 (padding 축소) */
  compact?: boolean
}

export function SearchBar({ compact = false }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<Platform>('kakao')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const result = PlayerSearchRequestSchema.safeParse({ name: query, platform })
    if (!result.success) return
    // TODO: trigger API call in T-008
    console.log('Search:', result.data)
  }

  const padding = compact ? 'p-0.5' : 'p-1'
  const inputPy = compact ? 'py-1.5' : 'py-2.5'
  const btnPx = compact ? 'px-3' : 'px-5'

  return (
    <form onSubmit={handleSubmit} className={`flex w-full gap-1.5 ${padding}`}>
      {/* 플랫폼 선택 */}
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value as Platform)}
        className={`rounded-xl border border-border bg-secondary px-3 ${inputPy} text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-24`}
        aria-label="플랫폼 선택"
      >
        {PLATFORMS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* 닉네임 입력 */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="플레이어 닉네임"
        className={`flex-1 rounded-xl border border-border bg-secondary px-4 ${inputPy} text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary`}
        aria-label="플레이어 닉네임"
        maxLength={64}
      />

      {/* 검색 버튼 */}
      <button
        type="submit"
        disabled={query.trim().length === 0}
        className={`rounded-xl bg-primary ${btnPx} ${inputPy} text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] disabled:cursor-not-allowed disabled:opacity-40`}
      >
        분석
      </button>
    </form>
  )
}
