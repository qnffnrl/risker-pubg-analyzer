import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pubgId = searchParams.get('pubgId') ?? ''

  const apiBase = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8081'

  let nickname = pubgId
  let aggression = 0, survival = 0, positioning = 0, teamplay = 0
  let llmSummary = ''

  try {
    const res = await fetch(`${apiBase}/api/v1/players/${encodeURIComponent(pubgId)}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json() as {
      success: boolean
      data?: {
        player: { nickname: string }
        latestAnalysis: { aggressionScore: string; survivalScore: string; positioningScore: string; teamplayScore: string; llmSummary?: string } | null
      }
    }
    if (json.success && json.data) {
      nickname = json.data.player.nickname
      const a = json.data.latestAnalysis
      if (a) {
        aggression = Math.round(Number(a.aggressionScore))
        survival = Math.round(Number(a.survivalScore))
        positioning = Math.round(Number(a.positioningScore))
        teamplay = Math.round(Number(a.teamplayScore))
        llmSummary = a.llmSummary?.slice(0, 90) ?? ''
      }
    }
  } catch {
    // fallback
  }

  const scores = [
    { label: '공격성', value: aggression, color: '#f43f5e' },
    { label: '생존형', value: survival, color: '#22c55e' },
    { label: '포지셔닝', value: positioning, color: '#3b82f6' },
    { label: '팀플레이', value: teamplay, color: '#f59e0b' },
  ]
  const topScore = scores.reduce((a, b) => a.value > b.value ? a : b)
  const styleLabel = topScore.label

  const barW = 220
  const bars = scores.map((s, i) => {
    const x = 80 + i * (barW + 28)
    const filledW = Math.round((s.value / 100) * barW)
    return `
      <text x="${x}" y="358" font-size="13" fill="#a1a1aa" font-family="sans-serif">${s.label}</text>
      <text x="${x + barW}" y="358" font-size="13" fill="${s.color}" font-weight="700" text-anchor="end" font-family="sans-serif">${s.value}</text>
      <rect x="${x}" y="366" width="${barW}" height="10" rx="5" fill="#27272a"/>
      <rect x="${x}" y="366" width="${filledW}" height="10" rx="5" fill="${s.color}"/>
    `
  }).join('')

  const summaryLine = llmSummary
    ? `<text x="80" y="470" font-size="15" fill="#71717a" font-style="italic" font-family="sans-serif">"${llmSummary.replace(/"/g, '&quot;')}..."</text>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="50%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="4" fill="url(#accent)"/>

  <text x="80" y="80" font-size="16" fill="#3b82f6" font-weight="700" letter-spacing="2" font-family="sans-serif">RISKER PUBG ANALYZER</text>

  <text x="80" y="200" font-size="68" fill="#ffffff" font-weight="900" font-family="sans-serif">${nickname.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
  <text x="80" y="245" font-size="22" fill="#71717a" font-family="sans-serif">의 배그 DNA</text>

  ${bars}

  <rect x="80" y="410" width="160" height="40" rx="8" fill="#3b82f620" stroke="#3b82f640"/>
  <text x="160" y="436" font-size="20" fill="#3b82f6" font-weight="700" text-anchor="middle" font-family="sans-serif">${styleLabel}</text>

  ${summaryLine}

  <text x="1120" y="590" font-size="14" fill="#3f3f46" text-anchor="end" font-family="sans-serif">pubg.risker.co.kr</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
