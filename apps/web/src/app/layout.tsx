import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PUBG Analyzer — Risker',
  description: 'PUBG 플레이 스타일 분석 대시보드 — 공격성, 생존형, 포지셔닝 지표를 한눈에',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  )
}
