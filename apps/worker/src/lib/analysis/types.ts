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
  dbnos: number
  killStreaks: number
  swimDistance: number
}

export interface AggressionMetrics {
  avg_kills: number
  avg_damage: number
  headshot_rate: number
  avg_assists: number
  kill_participation_rate: number
  damage_per_kill: number
  games_with_kills_rate: number
  damage_per_minute: number
}

export interface SurvivalMetrics {
  avg_survival_time_sec: number
  avg_placement: number
  top10_rate: number
  win_rate: number
  avg_boosts: number
  avg_heals: number
  survival_ratio: number
  top10_to_win_rate: number
  boost_ratio: number
  total_items_per_game: number
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

export interface ConsistencyMetrics {
  kill_consistency: number
  damage_consistency: number
}

export interface ClutchMetrics {
  knock_finish_rate: number
  kill_streak_avg: number
  top10_to_win_rate: number
}

export interface AnalysisResult {
  matchCount: number
  aggressionScore: number
  survivalScore: number
  positioningScore: number
  teamplayScore: number
  consistencyScore: number
  clutchScore: number
  aggressionMetrics: AggressionMetrics
  survivalMetrics: SurvivalMetrics
  positioningMetrics: PositioningMetrics
  teamplayMetrics: TeamplayMetrics
  consistencyMetrics: ConsistencyMetrics
  clutchMetrics: ClutchMetrics
}
