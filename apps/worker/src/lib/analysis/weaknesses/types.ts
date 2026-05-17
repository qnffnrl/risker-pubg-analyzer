import type { MatchRow } from '../types.js'

export interface WeaknessRule {
  id: string
  name: string
  tier: 1 | 2
  category: 'aggression' | 'survival' | 'positioning' | 'teamplay'
  evaluate(ctx: RuleContext): WeaknessFinding | null
}

export interface RuleContext {
  matches: MatchRow[]
  telemetry?: Map<string, unknown[]>  // matchDbId → events
  pubgAccountId?: string
}

export interface WeaknessFinding {
  ruleId: string
  ruleName: string
  category: string
  severity: number  // 0~1
  evidence: {
    metric: string
    value: number | string
    threshold: number | string
    matchesAffected?: number
  }
}
