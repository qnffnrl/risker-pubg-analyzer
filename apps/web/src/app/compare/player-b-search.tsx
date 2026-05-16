'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { searchPlayer, pollJobUntilDone, type Platform } from '@/lib/api-client'

interface PlayerBSearchProps {
  fixedA?: string
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'steam', label: 'Steam' },
  { value: 'kakao', label: 'Kakao' },
  { value: 'psn', label: 'PSN' },
  { value: 'xbox', label: 'Xbox' },
]

interface SearchState {
  nickname: string
  platform: Platform
  loading: boolean
  error: string | null
  progress: number
}

const DEFAULT_STATE: SearchState = {
  nickname: '',
  platform: 'steam',
  loading: false,
  error: null,
  progress: 0,
}

async function resolvePlayer(nickname: string, platform: Platform): Promise<string> {
  const res = await searchPlayer(nickname, platform)

  if (res.pubgId) return res.pubgId

  if (res.jobId) {
    await pollJobUntilDone(res.jobId, () => {})
    // 폴링 완료 후 재조회
    const res2 = await searchPlayer(nickname, platform)
    if (res2.pubgId) return res2.pubgId
  }

  throw new Error('플레이어를 찾을 수 없습니다.')
}

function PlayerSearchForm({
  label,
  state,
  onChange,
}: {
  label: string
  state: SearchState
  onChange: (partial: Partial<SearchState>) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {/* 플랫폼 선택 */}
      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange({ platform: p.value })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              state.platform === p.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {/* 닉네임 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={state.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          placeholder="닉네임 입력"
          className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {/* 진행률 바 */}
      {state.loading && state.progress > 0 && (
        <div className="h-1 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function PlayerBSearch({ fixedA }: PlayerBSearchProps) {
  const router = useRouter()

  // B 전용 상태
  const [stateB, setStateB] = useState<SearchState>(DEFAULT_STATE)

  // A+B 동시 검색용 (fixedA 없을 때)
  const [stateA, setStateA] = useState<SearchState>(DEFAULT_STATE)

  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function patchB(partial: Partial<SearchState>) {
    setStateB((prev) => ({ ...prev, ...partial }))
  }

  function patchA(partial: Partial<SearchState>) {
    setStateA((prev) => ({ ...prev, ...partial }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError(null)

    if (fixedA) {
      // B만 검색
      if (!stateB.nickname.trim()) {
        setGlobalError('닉네임을 입력하세요.')
        return
      }
      setLoading(true)
      patchB({ loading: true, error: null, progress: 0 })
      try {
        const pubgIdB = await resolvePlayer(stateB.nickname.trim(), stateB.platform)
        router.push(`/compare?a=${encodeURIComponent(fixedA)}&b=${encodeURIComponent(pubgIdB)}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '검색 실패'
        patchB({ error: msg, loading: false })
        setGlobalError(msg)
      } finally {
        setLoading(false)
      }
    } else {
      // A, B 둘 다 검색
      if (!stateA.nickname.trim() || !stateB.nickname.trim()) {
        setGlobalError('두 플레이어의 닉네임을 모두 입력하세요.')
        return
      }
      setLoading(true)
      patchA({ loading: true, error: null, progress: 0 })
      patchB({ loading: true, error: null, progress: 0 })
      try {
        const [pubgIdA, pubgIdB] = await Promise.all([
          resolvePlayer(stateA.nickname.trim(), stateA.platform),
          resolvePlayer(stateB.nickname.trim(), stateB.platform),
        ])
        router.push(`/compare?a=${encodeURIComponent(pubgIdA)}&b=${encodeURIComponent(pubgIdB)}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '검색 실패'
        setGlobalError(msg)
        patchA({ loading: false })
        patchB({ loading: false })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!fixedA && (
        <div className="rounded-xl border border-primary/20 bg-card p-5">
          <PlayerSearchForm label="플레이어 A" state={stateA} onChange={patchA} />
        </div>
      )}

      <div className="rounded-xl border border-amber-400/20 bg-card p-5">
        <PlayerSearchForm
          label={fixedA ? '비교할 플레이어 검색' : '플레이어 B'}
          state={stateB}
          onChange={patchB}
        />
      </div>

      {globalError && (
        <p className="text-center text-sm text-destructive">{globalError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            검색 중...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            비교하기
          </>
        )}
      </button>
    </form>
  )
}
