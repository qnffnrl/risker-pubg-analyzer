import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R005: WeaknessRule = {
  id: 'R005', name: '어시스트 부재', tier: 1, category: 'teamplay',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (ctx.matches.length < 10) return null
    const avgAssists = ctx.matches.reduce((s, r) => s + r.assists, 0) / ctx.matches.length
    const avgKills = ctx.matches.reduce((s, r) => s + r.kills, 0) / ctx.matches.length
    if (avgAssists >= 0.5 || avgKills <= 2) return null
    return {
      ruleId: 'R005', ruleName: '어시스트 부재', category: 'teamplay',
      severity: clamp01((0.5 - avgAssists) / 0.5),
      evidence: {
        metric: '게임당 평균 어시스트',
        value: avgAssists.toFixed(2),
        threshold: '0.5 (평균 킬 2 이상 게임 기준)',
        matchesAffected: ctx.matches.length,
      },
    }
  },
}
