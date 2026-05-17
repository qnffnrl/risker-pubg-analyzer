import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R001: WeaknessRule = {
  id: 'R001', name: '최근 폼 하락', tier: 1, category: 'aggression',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const recent = ctx.matches.slice(0, 5)
    const prev = ctx.matches.slice(5, 20)
    if (prev.length === 0) return null
    const recentAvg = recent.reduce((s, r) => s + r.damageDealt, 0) / recent.length
    const prevAvg = prev.reduce((s, r) => s + r.damageDealt, 0) / prev.length
    if (prevAvg === 0 || recentAvg / prevAvg >= 0.7) return null
    return {
      ruleId: 'R001', ruleName: '최근 폼 하락', category: 'aggression',
      severity: clamp01(1 - recentAvg / prevAvg),
      evidence: {
        metric: '최근 5게임 평균 데미지 / 이전 평균',
        value: Math.round(recentAvg),
        threshold: `${Math.round(prevAvg * 0.7)} (이전 평균의 70%)`,
        matchesAffected: 5,
      },
    }
  },
}
