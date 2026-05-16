import { Clock, Star } from 'lucide-react'

// T-012에서 실제 데이터 연결 예정 — 현재는 placeholder UI
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/50 bg-background/50 xl:flex xl:flex-col">
      <div className="flex flex-col gap-6 p-4">
        {/* 최근 검색 */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" />
            최근 검색
          </div>
          <div className="space-y-1">
            {/* placeholder 아이템 */}
            {['— 검색 기록 없음 —'].map((label) => (
              <div
                key={label}
                className="rounded-lg px-3 py-2 text-xs text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* 즐겨찾기 */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Star className="h-3 w-3" />
            즐겨찾기
          </div>
          <div className="space-y-1">
            <div className="rounded-lg px-3 py-2 text-xs text-muted-foreground">
              — 즐겨찾기 없음 —
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
