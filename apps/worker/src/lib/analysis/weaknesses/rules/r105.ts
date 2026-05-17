import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R105: WeaknessRule = {
  id: 'R105', name: '헤드샷 부재', tier: 2, category: 'aggression',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const totalKills = ctx.matches.reduce((s, r) => s + r.kills, 0)
    const totalHS = ctx.matches.reduce((s, r) => s + r.headshotKills, 0)
    const avgKills = totalKills / ctx.matches.length
    if (avgKills < 1) return null
    const rate = totalHS / Math.max(totalKills, 1)
    if (rate >= 0.08) return null
    return {
      ruleId: 'R105', ruleName: '헤드샷 부재', category: 'aggression',
      severity: clamp01((0.08 - rate) / 0.08),
      evidence: {
        metric: '헤드샷 킬 / 총 킬 비율',
        value: `${Math.round(rate * 100)}%`,
        threshold: '8%',
      },
    }
  },
}
