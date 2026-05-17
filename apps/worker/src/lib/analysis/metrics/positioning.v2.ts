import type { MatchRow } from '../types.js'

export interface PositioningV2Metrics {
  zone_center_score: number        // 30% — needs telemetry
  high_ground_score: number        // 25% — needs telemetry
  zone_timing_score: number        // 20% — needs telemetry
  vehicle_usage_rate: number       // 25% — from aggregate
  telemetry_available: boolean
}

export function calcPositioningV2(
  matches: MatchRow[],
  _telemetry?: Map<string, unknown[]>,
): { score: number; metrics: PositioningV2Metrics } {
  if (matches.length === 0) return { score: 0, metrics: { zone_center_score: 0, high_ground_score: 0, zone_timing_score: 0, vehicle_usage_rate: 0, telemetry_available: false } }

  const vehicleUsageRate = matches.filter(r => r.distanceInVehicle > 100).length / matches.length
  const vehicleScore = vehicleUsageRate * 100

  return {
    score: Math.round(vehicleScore * 0.25 * 100) / 100,
    metrics: {
      zone_center_score: 0,
      high_ground_score: 0,
      zone_timing_score: 0,
      vehicle_usage_rate: Math.round(vehicleUsageRate * 100) / 100,
      telemetry_available: false,
    },
  }
}
