'use client'

import { useState, type FormEvent } from 'react'
import { PlayerSearchRequestSchema } from '@risker/shared'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<'steam' | 'kakao' | 'psn' | 'xbox'>('steam')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = PlayerSearchRequestSchema.safeParse({ name: query, platform })
    if (!result.success) {
      // TODO: show validation error in T-003
      console.warn('Validation error:', result.error.flatten())
      return
    }

    // TODO: trigger API call in T-003
    console.log('Search:', result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      {/* Platform selector */}
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value as typeof platform)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-32"
        aria-label="플랫폼 선택"
      >
        <option value="steam">Steam</option>
        <option value="kakao">Kakao</option>
        <option value="psn">PS</option>
        <option value="xbox">Xbox</option>
      </select>

      {/* Nickname input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="플레이어 닉네임을 입력하세요"
        className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="플레이어 닉네임"
        maxLength={64}
      />

      {/* Search button */}
      <button
        type="submit"
        disabled={query.trim().length === 0}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        분석하기
      </button>
    </form>
  )
}
