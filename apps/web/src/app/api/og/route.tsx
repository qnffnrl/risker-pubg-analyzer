import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pubgId = searchParams.get('pubgId') ?? ''

  // Fetch player data from API
  const apiBase = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8081'

  let nickname = pubgId
  let aggression = 0, survival = 0, positioning = 0, teamplay = 0
  let styleLabel = ''
  let llmSummary = ''

  try {
    const res = await fetch(`${apiBase}/api/v1/players/${encodeURIComponent(pubgId)}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json() as { success: boolean; data?: { player: { nickname: string }; latestAnalysis: { aggressionScore: string; survivalScore: string; positioningScore: string; teamplayScore: string; llmSummary?: string } | null } }
    if (json.success && json.data) {
      nickname = json.data.player.nickname
      const a = json.data.latestAnalysis
      if (a) {
        aggression = Math.round(Number(a.aggressionScore))
        survival = Math.round(Number(a.survivalScore))
        positioning = Math.round(Number(a.positioningScore))
        teamplay = Math.round(Number(a.teamplayScore))
        llmSummary = a.llmSummary?.slice(0, 80) ?? ''
      }
    }
  } catch {
    // fallback to pubgId as nickname
  }

  // Simple style label based on highest score
  const scores = [
    { label: '공격형', value: aggression },
    { label: '생존형', value: survival },
    { label: '포지셔너', value: positioning },
    { label: '팀플레이어', value: teamplay },
  ]
  styleLabel = scores.reduce((a, b) => a.value > b.value ? a : b).label

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '18px', color: '#3b82f6', fontWeight: 700, letterSpacing: '2px' }}>RISKER PUBG ANALYZER</div>
        </div>

        {/* Nickname */}
        <div style={{ fontSize: '64px', fontWeight: 900, color: '#ffffff', marginBottom: '8px', letterSpacing: '-1px' }}>
          {nickname}
        </div>
        <div style={{ fontSize: '20px', color: '#71717a', marginBottom: '48px' }}>의 배그 DNA</div>

        {/* Score bars */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
          {[
            { label: '공격성', value: aggression, color: '#f43f5e' },
            { label: '생존형', value: survival, color: '#22c55e' },
            { label: '포지셔닝', value: positioning, color: '#3b82f6' },
            { label: '팀플레이', value: teamplay, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#a1a1aa' }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{value}</span>
              </div>
              <div style={{ height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${value}%`, background: color, borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Style label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: '8px', padding: '8px 20px', fontSize: '22px', fontWeight: 700, color: '#3b82f6' }}>
            {styleLabel}
          </div>
        </div>

        {/* LLM summary */}
        {llmSummary && (
          <div style={{ fontSize: '16px', color: '#71717a', fontStyle: 'italic' }}>
            "{llmSummary}..."
          </div>
        )}

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '40px', right: '80px', fontSize: '14px', color: '#3f3f46' }}>
          pubg.risker.co.kr
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=3600' },
    },
  )
}
