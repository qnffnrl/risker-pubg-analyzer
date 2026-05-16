export const SHARDS = ['steam', 'kakao', 'psn', 'xbox', 'console'] as const
export type Shard = (typeof SHARDS)[number]

export const PLATFORM_TO_SHARD: Record<string, Shard> = {
  steam: 'steam',
  kakao: 'kakao',
  psn: 'psn',
  xbox: 'xbox',
}

export const GAME_MODES = [
  'solo', 'solo-fpp',
  'duo', 'duo-fpp',
  'squad', 'squad-fpp',
] as const
export type GameMode = (typeof GAME_MODES)[number]

export const MAP_DISPLAY_NAMES: Record<string, string> = {
  Baltic_Main: '에란겔',
  Desert_Main: '미라마',
  Savage_Main: '사녹',
  DihorOtok_Main: '비켄디',
  Kiki_Main: '데스턴',
  Tiger_Main: '태이고',
  Neon_Main: '론도',
  Chimera_Main: '파라모',
  Arena_Main: '코데시나',
  Summerland_Main: '카라킨',
  Canarias_Main: '하반 섬',
}

export const PUBG_API_BASE = 'https://api.pubg.com'
