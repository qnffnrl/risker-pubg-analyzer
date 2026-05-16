import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { getPlayer, getCompare } from '@/lib/api'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { PlatformBadge } from '@/components/ui/platform-badge'
import { CompareView } from './compare-view'
import { PlayerBSearch } from './player-b-search'

interface Props {
  searchParams: { a?: string; b?: string }
}

export default async function ComparePage({ searchParams }: Props) {
  const pubgIdA = searchParams.a
  const pubgIdB = searchParams.b

  // 두 플레이어 ID 모두 없으면 검색 UI
  if (!pubgIdA) {
    return (
      <AppShell showSidebar showHeaderSearch>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <h1 className="mb-8 text-center text-2xl font-bold text-foreground">플레이어 비교</h1>
          <PlayerBSearch />
        </div>
      </AppShell>
    )
  }

  // A 플레이어 조회
  const profileA = await getPlayer(pubgIdA).catch(() => null)
  if (!profileA) {
    notFound()
  }

  // A만 있고 B 없는 경우: A 정보 + B 검색
  if (!pubgIdB) {
    return (
      <AppShell showSidebar showHeaderSearch>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 text-center text-xl font-bold text-foreground">플레이어 비교</h1>

          {/* A 플레이어 카드 */}
          <div className="mb-6 rounded-xl border border-primary/30 bg-card p-4 flex items-center gap-3">
            <PlayerAvatar nickname={profileA.player.nickname} size="md" />
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">{profileA.player.nickname}</p>
              <PlatformBadge platform={profileA.player.platform} />
            </div>
            <span className="ml-auto text-xs font-semibold text-primary shrink-0">A</span>
          </div>

          {/* B 검색 */}
          <p className="mb-4 text-sm text-muted-foreground text-center">비교할 플레이어를 검색하세요</p>
          <PlayerBSearch fixedA={pubgIdA} />
        </div>
      </AppShell>
    )
  }

  // 둘 다 있으면 비교 데이터 페칭
  const compareData = await getCompare(pubgIdA, pubgIdB).catch(() => null)
  if (!compareData || compareData.players.length < 2) {
    notFound()
  }

  const [entryA, entryB] = compareData.players

  return (
    <AppShell showSidebar showHeaderSearch>
      <CompareView entryA={entryA!} entryB={entryB!} />
    </AppShell>
  )
}
