import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Risker — PUBG 플레이 스타일 분석',
  description: '공격성 · 생존형 · 포지셔닝 · 팀플레이 — 4가지 성향으로 보는 당신의 배그 DNA',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
