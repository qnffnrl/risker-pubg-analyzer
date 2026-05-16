'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh({ delayMs = 8000 }: { delayMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(() => router.refresh(), delayMs)
    return () => clearTimeout(t)
  }, [router, delayMs])
  return null
}
