import { AppShell } from '@/components/layout/app-shell'
import { SearchBar } from '@/components/search-bar'

export default function HomePage() {
  return (
    <AppShell showSidebar={false} showHeaderSearch={false}>
      <div className="relative flex min-h-[calc(100vh-56px)] flex-col overflow-hidden">
        {/* 배경 그리드 */}
        <div className="bg-grid pointer-events-none absolute inset-0" />

        {/* 배경 glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />

        {/* 히어로 섹션 */}
        <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          {/* 배지 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary animate-fade-in">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            실시간 PUBG 전적 분석
          </div>

          {/* 타이틀 */}
          <h1 className="text-glow mb-4 max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-slide-up">
            당신의 배그
            <span className="block text-primary">DNA를 분석하세요</span>
          </h1>

          {/* 서브타이틀 */}
          <p className="mb-12 max-w-xl text-base text-muted-foreground sm:text-lg">
            킬, 생존, 포지셔닝, 팀플레이 — 4가지 성향 지표로 플레이 스타일을 정밀 해부합니다
          </p>

          {/* 검색바 */}
          <div className="glow-cyan w-full max-w-xl rounded-2xl border border-border/80 bg-card p-1.5">
            <SearchBar />
          </div>

          {/* 성향 배지 */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { label: '공격성', color: 'text-rose-400 border-rose-400/30 bg-rose-400/10' },
              { label: '생존형', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
              { label: '포지셔닝', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
              { label: '팀플레이', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${color}`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* 통계 */}
          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            {[
              { value: '4가지', label: '성향 지표' },
              { value: '20게임', label: '매치 분석' },
              { value: '실시간', label: 'AI 요약' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
