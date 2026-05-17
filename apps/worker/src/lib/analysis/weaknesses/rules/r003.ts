import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { stdDev, clamp01 } from '../utils.js'

export const R003: WeaknessRule = {
  id: 'R003', name: '단발 매치 의존', tier: 1, category: 'aggression',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const kills = ctx.matches.map(r => r.kills)
    const avg = kills.reduce((s, v) => s + v, 0) / kills.length
    if (avg <= 0.5) return null
    const cov = stdDev(kills) / avg
    if (cov <= 1.5) return null
    return {
      ruleId: 'R003', ruleName: '단발 매치 의존', category: 'aggression',
      severity: clamp01((cov - 1.5) / 1.5),
      evidence: {
        metric: '킬 변동계수 (표준편차/평균)',
        value: cov.toFixed(2),
        threshold: '1.5',
        matchesAffected: ctx.matches.length,
      },
    }
  },
}
