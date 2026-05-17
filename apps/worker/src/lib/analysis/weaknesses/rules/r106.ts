import type { WeaknessRule, WeaknessFinding, RuleContext } from '../types.js'

export const R106: WeaknessRule = {
  id: 'R106', name: '팀 이탈 패턴', tier: 2, category: 'teamplay',
  evaluate(_ctx: RuleContext): WeaknessFinding | null { return null },
}
