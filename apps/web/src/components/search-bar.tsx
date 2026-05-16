'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { searchPlayer, pollJobUntilDone, type Platform } from '@/lib/api-client'
import { addRecentSearch, getRecentSearches } from '@/lib/storage'

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'steam', label: 'Steam' },
  { value: 'kakao', label: 'Kakao' },
  { value: 'psn', label: 'PS' },
  { value: 'xbox', label: 'Xbox' },
]

type SearchState = 'idle' | 'searching' | 'polling' | 'error'

interface SearchBarProps {
  compact?: boolean
}

export function SearchBar({ compact = false }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<Platform>('kakao')
  const [state, setState] = useState<SearchState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const inputPy = compact ? 'py-1.5' : 'py-2.5'
  const btnPx = compact ? 'px-3' : 'px-5'

  function handleQueryChange(val: string) {
    setQuery(val)
    if (val.length >= 1) {
      const recent = getRecentSearches()
        .filter((r) => r.nickname.toLowerCase().startsWith(val.toLowerCase()))
        .map((r) => r.nickname)
        .slice(0, 5)
      setSuggestions(recent)
      setShowSuggestions(recent.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  async function doSearch(nickname: string, selectedPlatform: Platform) {
    if (nickname.trim().length < 1) return
    setShowSuggestions(false)
    setState('searching')
    setProgress(0)
    setErrorMsg('')

    try {
      const res = await searchPlayer(nickname.trim(), selectedPlatform)

      if (res.cached && res.player) {
        addRecentSearch({
          nickname: res.player.nickname,
          platform: res.player.platform,
          pubgId: res.player.pubgId,
        })
        router.push(`/players/${res.player.pubgId}`)
        return
      }

      if (!res.jobId) {
        setState('error')
        setErrorMsg('검색에 실패했습니다.')
        return
      }

      // pubgId가 이미 있으면 (기존 플레이어) polling 후 바로 이동 가능
      const knownPubgId = res.pubgId

      setState('polling')
      await pollJobUntilDone(res.jobId, (pct) => setProgress(pct))

      // Job done — pubgId 확보 후 이동
      const navigatePubgId = knownPubgId ?? (await searchPlayer(nickname.trim(), selectedPlatform)).pubgId

      if (navigatePubgId) {
        addRecentSearch({ nickname: nickname.trim(), platform, pubgId: navigatePubgId })
        router.push(`/players/${navigatePubgId}`)
      } else {
        setState('error')
        setErrorMsg('플레이어 정보를 가져오지 못했습니다.')
      }
    } catch (err: unknown) {
      setState('error')
      const code = (err as { code?: string }).code
      if (code === 'PLAYER_NOT_FOUND') {
        setErrorMsg('플레이어를 찾을 수 없습니다. 닉네임과 플랫폼을 확인하세요.')
      } else {
        setErrorMsg('오류가 발생했습니다. 잠시 후 다시 시도하세요.')
      }
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    doSearch(query, platform)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  const isLoading = state === 'searching' || state === 'polling'

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className={`flex w-full gap-1.5 ${compact ? 'p-0.5' : 'p-1'}`}>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          disabled={isLoading}
          className={`rounded-xl border border-border bg-secondary px-3 ${inputPy} text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-24 disabled:opacity-60`}
          aria-label="플랫폼 선택"
        >
          {PLATFORMS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="플레이어 닉네임"
            disabled={isLoading}
            className={`w-full rounded-xl border border-border bg-secondary px-4 ${inputPy} text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60`}
            aria-label="플레이어 닉네임"
            maxLength={64}
            autoComplete="off"
          />
          {showSuggestions && (
            <ul className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary"
                    onMouseDown={() => { setQuery(s); setShowSuggestions(false) }}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={query.trim().length === 0 || isLoading}
          className={`rounded-xl bg-primary ${btnPx} ${inputPy} text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {isLoading ? '...' : '분석'}
        </button>
      </form>

      {/* 진행 상태 */}
      {state === 'polling' && (
        <div className="px-2 pb-1">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>데이터 수집 중...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
        </div>
      )}

      {state === 'searching' && (
        <p className="px-2 pb-1 text-xs text-muted-foreground">검색 중...</p>
      )}

      {state === 'error' && (
        <p className="px-2 pb-1 text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  )
}
