import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'

export const R103: WeaknessRule = {
  id: 'R103', name: '오픈 필드 노출', tier: 2, category: 'positioning',
  evaluate(_ctx: RuleContext): WeaknessFinding | null { return null },
}
