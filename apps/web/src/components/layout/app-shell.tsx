import { Header } from './header'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppShellProps {
  children: React.ReactNode
  /** 사이드바 표시 여부 (홈 페이지 등에서는 false) */
  showSidebar?: boolean
  /** 헤더에 compact 검색바 표시 여부 */
  showHeaderSearch?: boolean
}

export function AppShell({
  children,
  showSidebar = false,
  showHeaderSearch = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header showSearch={showHeaderSearch} />

      <div className="flex flex-1">
        {showSidebar && <Sidebar />}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 pb-16 sm:pb-0">
          {children}
        </main>
      </div>

      {/* 모바일 하단 네비 */}
      <BottomNav />
    </div>
  )
}
