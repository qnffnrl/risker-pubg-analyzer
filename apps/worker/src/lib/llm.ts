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
  consistencyScore?: number
  clutchScore?: number
  consistencyMetrics?: Record<string, number>
  clutchMetrics?: Record<string, number>
}

function buildPrompt(i: LlmInput): string {
  const agg = i.aggressionMetrics
  const sur = i.survivalMetrics
  const pos = i.positioningMetrics
  const team = i.teamplayMetrics
  const con = i.consistencyMetrics ?? {}
  const clu = i.clutchMetrics ?? {}

  const consistencyLine = i.consistencyScore !== undefined
    ? `\n- 일관성: ${i.consistencyScore.toFixed(1)} (킬 편차 ${(con['kill_std_dev'] ?? 0).toFixed(2)}, 데미지 편차 ${Math.round(con['damage_std_dev'] ?? 0)})`
    : ''

  const clutchLine = i.clutchScore !== undefined
    ? `\n- 결정력: ${i.clutchScore.toFixed(1)} (넉다운 마무리율 ${Math.round((clu['knock_finish_rate'] ?? 0) * 100)}%, top10→우승 전환율 ${Math.round((clu['top10_to_win_rate'] ?? 0) * 100)}%)`
    : ''

  const keyMetrics = [
    agg['damage_per_kill'] !== undefined
      ? `킬당 데미지 ${Math.round(agg['damage_per_kill'])}` : null,
    clu['knock_finish_rate'] !== undefined
      ? `넉다운 마무리율 ${Math.round((clu['knock_finish_rate'] ?? 0) * 100)}%` : null,
    sur['survival_ratio'] !== undefined
      ? `생존 비율 ${Math.round((sur['survival_ratio'] ?? 0) * 100)}%` : null,
    clu['top10_to_win_rate'] !== undefined
      ? `top10→우승 전환율 ${Math.round((clu['top10_to_win_rate'] ?? 0) * 100)}%` : null,
  ].filter(Boolean).join(', ')

  return `다음은 PUBG 플레이어 "${i.nickname}"의 최근 ${i.matchCount}매치 분석 결과입니다.

플레이 스타일 점수 (0~100):
- 공격성: ${i.aggressionScore.toFixed(1)} (평균 킬 ${(agg['avg_kills'] ?? 0).toFixed(1)}, 평균 데미지 ${Math.round(agg['avg_damage'] ?? 0)}, 헤드샷율 ${Math.round((agg['headshot_rate'] ?? 0) * 100)}%)
- 생존형: ${i.survivalScore.toFixed(1)} (평균 생존 ${Math.round((sur['avg_survival_time_sec'] ?? 0) / 60)}분, 탑10율 ${Math.round((sur['top10_rate'] ?? 0) * 100)}%, 승률 ${Math.round((sur['win_rate'] ?? 0) * 100)}%)
- 포지셔닝: ${i.positioningScore.toFixed(1)} (도보 ${((pos['avg_walk_distance'] ?? 0) / 1000).toFixed(1)}km, 차량 ${((pos['avg_vehicle_distance'] ?? 0) / 1000).toFixed(1)}km)
- 팀플레이: ${i.teamplayScore.toFixed(1)} (평균 부활 ${(team['avg_revives'] ?? 0).toFixed(1)}회, 어시스트 ${(team['avg_assists'] ?? 0).toFixed(1)}회)${consistencyLine}${clutchLine}
${keyMetrics ? `\n주요 지표: ${keyMetrics}\n` : ''}
이 플레이어의 PUBG 플레이 성향을 한국어로 2~3문장으로 자연스럽게 요약하세요. 수치를 나열하지 말고 전투 스타일, 생존 전략, 팀 내 역할을 중심으로 서술하세요. 마지막 문장은 반드시 "가장 개선이 필요한 점은 ~입니다." 형식으로 실력 개선 포인트를 한 문장 추가하세요. 마크다운 없이 순수 텍스트로만 작성하세요.`
}

export async function generateCoachingMessage(
  weakness: { ruleName: string; category: string; evidence: { metric: string; value: number | string; threshold: number | string } },
  nickname: string,
  matchCount: number,
): Promise<string | null> {
  const prompt = `다음은 PUBG 플레이어 "${nickname}"의 최근 ${matchCount}매치에서 감지된 약점입니다.

약점: ${weakness.ruleName}
카테고리: ${weakness.category}
근거: ${weakness.evidence.metric} = ${weakness.evidence.value} (임계값 ${weakness.evidence.threshold})

이 약점에 대해 다음을 만족하는 코칭 메시지를 한국어로 작성하세요:
1. 첫 문장: 무엇이 문제인지 (수치 한 개 인용)
2. 두 번째 문장: 왜 이게 실력 향상을 막는지 (게임 메커니즘 관점)
3. 세 번째 문장: 다음 게임에서 시도할 구체적 행동 1개 (추상적인 조언 금지)

3문장, 마크다운 없이, 따뜻하지만 직설적인 톤으로. 격려/위로 표현 금지.`

  try {
    const { stdout } = await execFileAsync('claude', ['-p', prompt], {
      timeout: 30_000,
      maxBuffer: 16 * 1024,
    })
    const message = stdout.trim()
    return message.length > 10 ? message : null
  } catch (err) {
    console.warn('[llm] claude CLI unavailable, skipping coaching message:', (err as Error).message?.slice(0, 120))
    return null
  }
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
