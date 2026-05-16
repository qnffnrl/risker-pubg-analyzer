import { SearchBar } from '@/components/search-bar'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Hero */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            PUBG Analyzer
          </h1>
          <p className="text-lg text-muted-foreground">
            플레이어 닉네임을 입력해 공격성·생존형·포지셔닝 스타일을 분석하세요
          </p>
        </div>

        {/* Search */}
        <SearchBar />

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {['공격성 지표', '생존 스타일', '포지셔닝', '팀플레이'].map((label) => (
            <span
              key={label}
              className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}
