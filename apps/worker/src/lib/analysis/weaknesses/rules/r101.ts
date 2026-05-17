import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'
import { clamp01 } from '../utils.js'

export const R101: WeaknessRule = {
  id: 'R101', name: '첫 교전 후 즉사', tier: 2, category: 'survival',
  evaluate(ctx: RuleContext): WeaknessFinding | null {
    if (!ctx.telemetry || !ctx.pubgAccountId) return null
    const matchIds = [...ctx.telemetry.keys()]
    if (matchIds.length < 10) return null

    let earlyDeathMatches = 0
    for (const events of ctx.telemetry.values()) {
      const killEvents = (events as Array<Record<string, unknown>>)
        .filter(e => e['_T'] === 'LogPlayerKillV2')
      const playerDeath = killEvents.find(
        e => (e['victim'] as Record<string, unknown>)?.['accountId'] === ctx.pubgAccountId,
      )
      if (playerDeath) {
        const deathIdx = (events as Array<Record<string, unknown>>).indexOf(playerDeath)
        const totalEvents = events.length
        if (deathIdx < totalEvents * 0.3) earlyDeathMatches++
      }
    }
    const rate = earlyDeathMatches / matchIds.length
    if (rate < 0.4) return null
    return {
      ruleId: 'R101', ruleName: '첫 교전 후 즉사', category: 'survival',
      severity: clamp01((rate - 0.4) / 0.6),
      evidence: {
        metric: '전체 매치 중 초반 사망 비율',
        value: `${Math.round(rate * 100)}%`,
        threshold: '40%',
        matchesAffected: earlyDeathMatches,
      },
    }
  },
}
