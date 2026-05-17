import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'

export const R102: WeaknessRule = {
  id: 'R102', name: '후방 피격 다발', tier: 2, category: 'positioning',
  evaluate(_ctx: RuleContext): WeaknessFinding | null { return null },
}
