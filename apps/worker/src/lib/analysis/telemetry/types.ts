import { z } from 'zod'

const LocationSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
}).passthrough()

const CharacterSchema = z.object({
  accountId: z.string(),
  name: z.string().optional(),
  location: LocationSchema.optional(),
  health: z.number().optional(),
}).passthrough()

const EventBaseSchema = z.object({
  _T: z.string(),
  _D: z.string(),
}).passthrough()

export const LogMatchStartSchema = EventBaseSchema.extend({
  _T: z.literal('LogMatchStart'),
  mapName: z.string().optional(),
  weatherId: z.string().optional(),
  characters: z.array(CharacterSchema).optional(),
}).passthrough()

export const LogPlayerKillV2Schema = EventBaseSchema.extend({
  _T: z.literal('LogPlayerKillV2'),
  attackId: z.number().optional(),
  dBNOId: z.number().optional(),
  victimGameResult: z.object({
    rank: z.number().optional(),
    gameResultOnFinished: z.string().optional(),
  }).passthrough().optional(),
  victim: CharacterSchema,
  killerGameResult: z.object({
    rank: z.number().optional(),
  }).passthrough().optional(),
  killer: CharacterSchema.optional(),
  finisher: CharacterSchema.optional(),
  isSuicide: z.boolean().optional(),
  damageCauserName: z.string().optional(),
  damageReason: z.string().optional(),
  damageTypeCategory: z.string().optional(),
  killerDamageInfo: z.object({
    damageElement: z.string().optional(),
    damageCauserAdditionalInfo: z.array(z.string()).optional(),
    isConsecutiveDamage: z.boolean().optional(),
    additionalInfo: z.array(z.string()).optional(),
    distance: z.number().optional(),
    isThroughPenetrableWall: z.boolean().optional(),
  }).passthrough().optional(),
  finishDamageInfo: z.object({
    distance: z.number().optional(),
  }).passthrough().optional(),
}).passthrough()

export const LogPlayerTakeDamageSchema = EventBaseSchema.extend({
  _T: z.literal('LogPlayerTakeDamage'),
  attackId: z.number().optional(),
  attacker: CharacterSchema.optional(),
  victim: CharacterSchema,
  damageReason: z.string().optional(),
  damageTypeCategory: z.string().optional(),
  damageCauserName: z.string().optional(),
  damage: z.number(),
  isThroughPenetrableWall: z.boolean().optional(),
}).passthrough()

export const LogPlayerPositionSchema = EventBaseSchema.extend({
  _T: z.literal('LogPlayerPosition'),
  character: CharacterSchema,
  vehicle: z.object({
    vehicleId: z.string().optional(),
    vehicleType: z.string().optional(),
  }).passthrough().optional(),
  elapsedTime: z.number().optional(),
  numAlivePlayers: z.number().optional(),
}).passthrough()

export const LogGameStatePeriodicSchema = EventBaseSchema.extend({
  _T: z.literal('LogGameStatePeriodic'),
  gameState: z.object({
    elapsedTime: z.number().optional(),
    numAliveTeams: z.number().optional(),
    numJoinPlayers: z.number().optional(),
    numStartPlayers: z.number().optional(),
    numAlivePlayers: z.number().optional(),
    safetyZonePosition: LocationSchema.optional(),
    safetyZoneRadius: z.number().optional(),
    poisonGasWarningPosition: LocationSchema.optional(),
    poisonGasWarningRadius: z.number().optional(),
    redZonePosition: LocationSchema.optional(),
    redZoneRadius: z.number().optional(),
  }).passthrough().optional(),
}).passthrough()

// TelemetryEventSchema uses a union of the known typed schemas plus a generic
// EventBaseSchema fallback for unknown event types not yet explicitly modelled.
export const TelemetryEventSchema = z.union([
  LogMatchStartSchema,
  LogPlayerKillV2Schema,
  LogPlayerTakeDamageSchema,
  LogPlayerPositionSchema,
  LogGameStatePeriodicSchema,
  EventBaseSchema,
])

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>
export type LogMatchStart = z.infer<typeof LogMatchStartSchema>
export type LogPlayerKillV2 = z.infer<typeof LogPlayerKillV2Schema>
export type LogPlayerTakeDamage = z.infer<typeof LogPlayerTakeDamageSchema>
export type LogPlayerPosition = z.infer<typeof LogPlayerPositionSchema>
export type LogGameStatePeriodic = z.infer<typeof LogGameStatePeriodicSchema>
