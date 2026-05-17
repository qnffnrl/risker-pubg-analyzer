import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R004: WeaknessRule = {
  id: 'R004', name: '자기장 늦진입', tier: 1, category: 'positioning',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const avgSurvival = ctx.matches.reduce((s, r) => s + r.timeSurvived, 0) / ctx.matches.length
    const avgPlacement = ctx.matches.reduce((s, r) => s + r.placement, 0) / ctx.matches.length
    if (avgSurvival >= 600 || avgPlacement <= 50) return null
    return {
      ruleId: 'R004', ruleName: '자기장 늦진입', category: 'positioning',
      severity: clamp01((600 - avgSurvival) / 600),
      evidence: {
        metric: '평균 생존시간',
        value: `${Math.round(avgSurvival)}초`,
        threshold: '600초 (10분)',
        matchesAffected: ctx.matches.length,
      },
    }
  },
}
