import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R007: WeaknessRule = {
  id: 'R007', name: '무기 다양성 부족', tier: 1, category: 'positioning',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const avgWeapons = ctx.matches.reduce((s, r) => s + r.weaponsAcquired, 0) / ctx.matches.length
    if (avgWeapons >= 3) return null
    return {
      ruleId: 'R007', ruleName: '무기 다양성 부족', category: 'positioning',
      severity: clamp01((3 - avgWeapons) / 3),
      evidence: {
        metric: '게임당 평균 획득 무기 수',
        value: avgWeapons.toFixed(1),
        threshold: '3',
        matchesAffected: ctx.matches.length,
      },
    }
  },
}
