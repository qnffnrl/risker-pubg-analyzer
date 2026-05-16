import Link from 'next/link'
import { SearchBar } from '@/components/search-bar'

interface HeaderProps {
  showSearch?: boolean
}

export function Header({ showSearch = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* 로고 */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold tracking-tight text-foreground">
          RISKER
        </span>
        <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary">
          PUBG
        </span>
      </Link>

      {/* 데스크톱 검색바 (compact) */}
      {showSearch && (
        <div className="hidden max-w-sm flex-1 mx-6 md:block">
          <div className="rounded-xl border border-border/80 bg-card">
            <SearchBar compact />
          </div>
        </div>
      )}

      {/* 데스크톱 네비 */}
      <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
        <Link href="/" className="transition-colors hover:text-foreground">
          홈
        </Link>
        <Link href="/compare" className="transition-colors hover:text-foreground">
          비교
        </Link>
        <Link href="/admin" className="transition-colors hover:text-foreground">
          관리
        </Link>
      </nav>

      {/* 모바일: 검색 아이콘 공간 (placeholder) */}
      <div className="flex items-center gap-2 sm:hidden">
        <span className="text-xs text-muted-foreground">PUBG</span>
      </div>
    </header>
  )
}
