import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R002: WeaknessRule = {
  id: 'R002', name: '회복템 미사용', tier: 1, category: 'survival',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const avgItems = ctx.matches.reduce((s, r) => s + r.boosts + r.heals, 0) / ctx.matches.length
    const avgSurvival = ctx.matches.reduce((s, r) => s + r.timeSurvived, 0) / ctx.matches.length
    if (avgItems > 3 || avgSurvival <= 15 * 60) return null
    return {
      ruleId: 'R002', ruleName: '회복템 미사용', category: 'survival',
      severity: clamp01((3 - avgItems) / 3),
      evidence: {
        metric: '게임당 평균 부스터+힐 사용',
        value: avgItems.toFixed(1),
        threshold: '3개 초과 (생존 15분 이상 게임 기준)',
        matchesAffected: ctx.matches.length,
      },
    }
  },
}
