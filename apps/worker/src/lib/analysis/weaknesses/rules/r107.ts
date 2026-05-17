import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'

export const R107: WeaknessRule = {
  id: 'R107', name: '루팅 과다', tier: 2, category: 'survival',
  evaluate(_ctx: RuleContext): WeaknessFinding | null { return null },
}
