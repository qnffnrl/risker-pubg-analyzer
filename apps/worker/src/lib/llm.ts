import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface LlmInput {
  nickname: string
  matchCount: number
  aggressionScore: number
  survivalScore: number
  positioningScore: number
  teamplayScore: number
  aggressionMetrics: Record<string, number>
  survivalMetrics: Record<string, number>
  positioningMetrics: Record<string, number>
  teamplayMetrics: Record<string, number>
}

function buildPrompt(i: LlmInput): string {
  const agg = i.aggressionMetrics
  const sur = i.survivalMetrics
  const pos = i.positioningMetrics
  const team = i.teamplayMetrics

  return `다음은 PUBG 플레이어 "${i.nickname}"의 최근 ${i.matchCount}매치 분석 결과입니다.

플레이 스타일 점수 (0~100):
- 공격성: ${i.aggressionScore.toFixed(1)} (평균 킬 ${(agg['avg_kills'] ?? 0).toFixed(1)}, 평균 데미지 ${Math.round(agg['avg_damage'] ?? 0)}, 헤드샷율 ${Math.round((agg['headshot_rate'] ?? 0) * 100)}%)
- 생존형: ${i.survivalScore.toFixed(1)} (평균 생존 ${Math.round((sur['avg_survival_time_sec'] ?? 0) / 60)}분, 탑10율 ${Math.round((sur['top10_rate'] ?? 0) * 100)}%, 승률 ${Math.round((sur['win_rate'] ?? 0) * 100)}%)
- 포지셔닝: ${i.positioningScore.toFixed(1)} (도보 ${((pos['avg_walk_distance'] ?? 0) / 1000).toFixed(1)}km, 차량 ${((pos['avg_vehicle_distance'] ?? 0) / 1000).toFixed(1)}km)
- 팀플레이: ${i.teamplayScore.toFixed(1)} (평균 부활 ${(team['avg_revives'] ?? 0).toFixed(1)}회, 어시스트 ${(team['avg_assists'] ?? 0).toFixed(1)}회)

이 플레이어의 PUBG 플레이 성향을 한국어로 2~3문장으로 자연스럽게 요약하세요. 수치를 나열하지 말고 전투 스타일, 생존 전략, 팀 내 역할을 중심으로 서술하세요. 마크다운 없이 순수 텍스트로만 작성하세요.`
}

export async function generateLlmSummary(input: LlmInput): Promise<string | null> {
  const prompt = buildPrompt(input)

  try {
    const { stdout } = await execFileAsync('claude', ['-p', prompt], {
      timeout: 30_000,
      maxBuffer: 16 * 1024,
    })
    const summary = stdout.trim()
    return summary.length > 10 ? summary : null
  } catch (err) {
    console.warn('[llm] claude CLI unavailable, skipping summary:', (err as Error).message?.slice(0, 120))
    return null
  }
}
