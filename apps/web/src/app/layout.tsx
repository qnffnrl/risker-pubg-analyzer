import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'risker-pubg-analyzer',
  description: '공격성 · 생존형 · 포지셔닝 · 팀플레이 — 4가지 성향으로 보는 당신의 배그 DNA',
  metadataBase: new URL('https://pubg.risker.co.kr'),
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body
        className={`min-h-screen bg-background font-sans text-foreground antialiased ${inter.className}`}
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {children}
      </body>
    </html>
  )
}
