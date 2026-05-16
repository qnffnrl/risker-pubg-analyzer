'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh({ delayMs = 8000 }: { delayMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => router.refresh(), delayMs)
    return () => clearInterval(t)
  }, [router, delayMs])
  return null
}
