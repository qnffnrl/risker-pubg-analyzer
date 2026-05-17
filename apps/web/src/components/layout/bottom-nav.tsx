'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/compare', label: '비교', icon: BarChart2 },
  { href: '/admin', label: '관리자', icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/50 bg-background/90 backdrop-blur-md sm:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`}
              strokeWidth={isActive ? 2.5 : 1.75}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
