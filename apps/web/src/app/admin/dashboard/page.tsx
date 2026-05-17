'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface SummaryData {
  todayVisits: number
  todaySearches: number
  cacheHitRate: number
  avgResponseMs: number
}

interface TrafficRow {
  hour: string
  requestCount: number
  errorCount: number
}

interface PopularPlayer {
  nickname: string | null
  searchCount: number
}

interface LogEntry {
  id: string
  path: string
  method: string
  statusCode: number | null
  ipAddress: string | null
  userAgent: string | null
  durationMs: number | null
  searchedPlayer: string | null
  createdAt: string
}

interface QueueStatus {
  waiting: number
  active: number
  completed: number
  failed: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [traffic, setTraffic] = useState<TrafficRow[]>([])
  const [popular, setPopular] = useState<PopularPlayer[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [queue, setQueue] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const apiBase =
    typeof window !== 'undefined'
      ? (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8081')
      : ''

  useEffect(() => {
    const t = sessionStorage.getItem('admin_token')
    if (!t) {
      router.replace('/admin')
      return
    }
    setToken(t)
  }, [router])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    async function fetchAll() {
      setLoading(true)
      try {
        const [s, tr, pop, lg, q] = await Promise.all([
          fetch(`${apiBase}/api/v1/admin/stats/summary`, { headers }).then((r) => r.json()),
          fetch(`${apiBase}/api/v1/admin/stats/traffic`, { headers }).then((r) => r.json()),
          fetch(`${apiBase}/api/v1/admin/stats/popular-players?limit=10`, { headers }).then((r) =>
            r.json(),
          ),
          fetch(`${apiBase}/api/v1/admin/logs?limit=50`, { headers }).then((r) => r.json()),
          fetch(`${apiBase}/api/v1/admin/queue/status`, { headers }).then((r) => r.json()),
        ])
        setSummary((s as { data: SummaryData }).data)
        setTraffic(((tr as { data?: TrafficRow[] }).data) ?? [])
        setPopular(((pop as { data?: PopularPlayer[] }).data) ?? [])
        setLogs(((lg as { data?: LogEntry[] }).data) ?? [])
        setQueue(((q as { data: QueueStatus }).data))
      } finally {
        setLoading(false)
      }
    }
    void fetchAll()
  }, [token, apiBase])

  function logout() {
    sessionStorage.removeItem('admin_token')
    router.push('/admin')
  }

  if (!token || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground">로딩 중...</span>
      </div>
    )
  }

  const maxSearchCount = Math.max(...popular.map((p) => p.searchCount ?? 0), 1)

  const chartData = traffic.map((r) => ({
    hour: new Date(r.hour).getHours() + '시',
    requests: Number(r.requestCount),
    errors: Number(r.errorCount),
  }))

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>
          <button
            onClick={logout}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            로그아웃
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: '오늘 방문', value: summary?.todayVisits ?? 0, unit: '회' },
            { label: '오늘 검색', value: summary?.todaySearches ?? 0, unit: '회' },
            { label: '캐시 히트율', value: summary?.cacheHitRate ?? 0, unit: '%' },
            { label: '평균 응답시간', value: summary?.avgResponseMs ?? 0, unit: 'ms' },
          ].map(({ label, value, unit }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <p className="text-2xl font-bold text-foreground">
                {value}
                <span className="text-sm text-muted-foreground">{unit}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Queue status */}
        {queue && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: '대기 중', value: queue.waiting, color: 'text-yellow-400' },
              { label: '처리 중', value: queue.active, color: 'text-blue-400' },
              { label: '오늘 완료', value: queue.completed, color: 'text-green-400' },
              { label: '오늘 실패', value: queue.failed, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center"
              >
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="mt-1 text-xs text-zinc-500">{label} 잡</p>
              </div>
            ))}
          </div>
        )}

        {/* Traffic chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            시간대별 트래픽 (최근 24시간)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="요청"
              />
              <Line
                type="monotone"
                dataKey="errors"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                name="에러"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Popular players */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            인기 검색 플레이어 Top 10
          </h2>
          <div className="space-y-2">
            {popular.map((p, i) => (
              <div key={p.nickname ?? i} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                <span className="w-32 truncate text-sm text-foreground">{p.nickname}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(p.searchCount / maxSearchCount) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-muted-foreground">
                  {p.searchCount}회
                </span>
              </div>
            ))}
            {popular.length === 0 && (
              <p className="text-sm text-muted-foreground">데이터 없음</p>
            )}
          </div>
        </div>

        {/* Recent logs */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">최근 요청 로그</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 text-left font-medium">시각</th>
                  <th className="pb-2 text-left font-medium">경로</th>
                  <th className="pb-2 text-right font-medium">상태</th>
                  <th className="pb-2 text-right font-medium">응답시간</th>
                  <th className="pb-2 text-right font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 hover:bg-secondary/30"
                  >
                    <td className="py-1.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-1.5 pr-4 max-w-[200px] truncate text-foreground">
                      {log.path}
                    </td>
                    <td
                      className={`py-1.5 pr-4 text-right font-medium ${
                        (log.statusCode ?? 0) >= 400 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {log.statusCode}
                    </td>
                    <td className="py-1.5 pr-4 text-right text-muted-foreground">
                      {log.durationMs}ms
                    </td>
                    <td className="py-1.5 text-right text-muted-foreground">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
