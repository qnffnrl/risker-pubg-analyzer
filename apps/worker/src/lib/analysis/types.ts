export interface MatchRow {
  kills: number
  assists: number
  damageDealt: number
  headshotKills: number
  distanceOnFoot: number
  distanceInVehicle: number
  timeSurvived: number
  boosts: number
  heals: number
  weaponsAcquired: number
  revives: number
  teamKills: number
  placement: number
  totalPlayers: number
  durationSec: number
}

export interface AggressionMetrics {
  avg_kills: number
  avg_damage: number
  headshot_rate: number
  avg_assists: number
  kill_participation_rate: number
}

export interface SurvivalMetrics {
  avg_survival_time_sec: number
  avg_placement: number
  top10_rate: number
  win_rate: number
  avg_boosts: number
  avg_heals: number
}

export interface PositioningMetrics {
  avg_walk_distance: number
  avg_vehicle_distance: number
  vehicle_usage_rate: number
  avg_weapons_acquired: number
  top10_rate: number
}

export interface TeamplayMetrics {
  avg_revives: number
  avg_assists: number
  avg_team_kills: number
  support_score: number
}

export interface AnalysisResult {
  matchCount: number
  aggressionScore: number
  survivalScore: number
  positioningScore: number
  teamplayScore: number
  aggressionMetrics: AggressionMetrics
  survivalMetrics: SurvivalMetrics
  positioningMetrics: PositioningMetrics
  teamplayMetrics: TeamplayMetrics
}
