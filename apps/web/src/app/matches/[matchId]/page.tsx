import { notFound } from 'next/navigation'
import { getMatchDetail } from '@/lib/api'
import { MatchDetailView } from './match-detail-view'

interface Props {
  params: { matchId: string }
  searchParams: { player?: string }
}

export default async function MatchDetailPage({ params, searchParams }: Props) {
  const { matchId } = params
  const pubgId = searchParams.player

  try {
    const data = await getMatchDetail(matchId)
    return <MatchDetailView data={data} pubgId={pubgId} />
  } catch {
    notFound()
  }
}
