import type { RuleContext, WeaknessFinding } from './types.js'
import { R001 } from './rules/r001.js'
import { R002 } from './rules/r002.js'
import { R003 } from './rules/r003.js'
import { R004 } from './rules/r004.js'
import { R005 } from './rules/r005.js'
import { R006 } from './rules/r006.js'
import { R007 } from './rules/r007.js'
import { R101 } from './rules/r101.js'
import { R102 } from './rules/r102.js'
import { R103 } from './rules/r103.js'
import { R104 } from './rules/r104.js'
import { R105 } from './rules/r105.js'
import { R106 } from './rules/r106.js'
import { R107 } from './rules/r107.js'

const ALL_RULES = [R001, R002, R003, R004, R005, R006, R007, R101, R102, R103, R104, R105, R106, R107]

export function evaluateWeaknesses(ctx: RuleContext): WeaknessFinding[] {
  const findings: WeaknessFinding[] = []
  for (const rule of ALL_RULES) {
    try {
      const result = rule.evaluate(ctx)
      if (result) findings.push(result)
    } catch { /* skip failing rules */ }
  }
  return findings.sort((a, b) => b.severity - a.severity)
}
