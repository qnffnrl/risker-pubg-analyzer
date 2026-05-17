import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R006: WeaknessRule = {
  id: 'R006', name: '차량 의존 / 도보 부족', tier: 1, category: 'positioning',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const avgWalk = ctx.matches.reduce((s, r) => s + r.distanceOnFoot, 0) / ctx.matches.length
    const avgPlacement = ctx.matches.reduce((s, r) => s + r.placement, 0) / ctx.matches.length
    if (avgWalk >= 1500 || avgPlacement <= 30) return null
    return {
      ruleId: 'R006', ruleName: '차량 의존 / 도보 부족', category: 'positioning',
      severity: clamp01((1500 - avgWalk) / 1500),
      evidence: {
        metric: '게임당 평균 도보 이동 거리',
        value: `${Math.round(avgWalk)}m`,
        threshold: '1500m',
        matchesAffected: ctx.matches.length,
      },
    }
  },
}
