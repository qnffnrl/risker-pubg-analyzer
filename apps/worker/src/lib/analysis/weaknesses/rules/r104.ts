import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'

export const R104: WeaknessRule = {
  id: 'R104', name: '과도한 교전 이탈', tier: 2, category: 'aggression',
  evaluate(_ctx: RuleContext): WeaknessFinding | null { return null },
}
