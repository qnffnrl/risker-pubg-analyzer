import { avg, clampScore, rate, weightedScore } from '../normalizer.js'
import type { MatchRow, PositioningMetrics } from '../types.js'

const MAX_WALK = 4000
const MAX_VEHICLE = 3000
const MAX_TOTAL_DIST = 6000

export function calcPositioning(matches: MatchRow[]): { score: number; metrics: PositioningMetrics } {
  const avgWalk = avg(matches.map((m) => m.distanceOnFoot))
  const avgVehicle = avg(matches.map((m) => m.distanceInVehicle))
  const avgTotal = avgWalk + avgVehicle
  const vehicleUsageRate = rate(
    matches.filter((m) => m.distanceInVehicle > 100).length,
    matches.length,
  )
  const avgWeapons = avg(matches.map((m) => m.weaponsAcquired))
  const top10Rate = rate(
    matches.filter((m) => m.placement <= 10).length,
    matches.length,
  )

  const score = weightedScore([
    [clampScore(avgWalk, MAX_WALK), 0.30],
    [clampScore(avgVehicle, MAX_VEHICLE), 0.20],
    [clampScore(avgTotal, MAX_TOTAL_DIST), 0.25],
    [clampScore(top10Rate, 1.0) , 0.25],
  ])

  return {
    score,
    metrics: {
      avg_walk_distance: avgWalk,
      avg_vehicle_distance: avgVehicle,
      vehicle_usage_rate: vehicleUsageRate,
      avg_weapons_acquired: avgWeapons,
      top10_rate: top10Rate,
    },
  }
}
