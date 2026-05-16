# T-004 PRD — PUBG API 클라이언트

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

Krafton PUBG API를 안전하게 호출하는 TypeScript 클라이언트를 구현한다.
Rate Limit 준수, Zod 응답 검증, 재시도 로직을 포함한다.

## 참고 문서

- **공식 API 문서**: https://documentation.pubg.com/en/introduction.html
- Rate Limit, 인증 방식, 응답 포맷 등 모든 스펙은 공식 문서 기준 적용

## PUBG API 엔드포인트

| 용도 | 엔드포인트 |
|------|-----------|
| 플레이어 조회 (닉네임) | `GET /shards/{shard}/players?filter[playerNames]={name}` |
| 플레이어 조회 (ID) | `GET /shards/{shard}/players/{accountId}` |
| 매치 목록 (플레이어) | 위 응답의 `relationships.matches` |
| 매치 상세 | `GET /shards/{shard}/matches/{matchId}` |
| 시즌 목록 | `GET /shards/{shard}/seasons` |
| 플레이어 시즌 스탯 | `GET /shards/{shard}/players/{accountId}/seasons/{seasonId}` |
| 무기 마스터리 | `GET /shards/{shard}/players/{accountId}/weapon_mastery` |

## Rate Limit 규칙

- 기본: 10 req/min (API 키 없음) → API 키 사용 시 기준 확인
- `apps/worker` 내부 큐 처리로 분산, 동시 요청 제어
- 429 응답 시 Retry-After 헤더 준수 + exponential backoff

## 구현 사항

### `packages/shared/src/pubg/`

```
schemas/
  player.schema.ts      # Zod — PUBG 플레이어 응답
  match.schema.ts       # Zod — 매치 상세 응답 (복잡한 JSON:API 구조)
  season.schema.ts      # Zod — 시즌 목록
  stats.schema.ts       # Zod — 플레이어 시즌 스탯
  weapon.schema.ts      # Zod — 무기 마스터리
types.ts                # 위 스키마에서 infer된 TypeScript 타입
constants.ts            # SHARD 목록, MODE 목록, MAP_NAME 매핑
```

### `apps/worker/src/lib/pubg-client.ts`

```typescript
class PubgApiClient {
  async getPlayerByName(shard: Shard, name: string): Promise<Player>
  async getPlayerById(shard: Shard, accountId: string): Promise<Player>
  async getMatch(shard: Shard, matchId: string): Promise<Match>
  async getPlayerSeasonStats(shard: Shard, accountId: string, seasonId: string): Promise<PlayerSeasonStats>
  async getWeaponMastery(shard: Shard, accountId: string): Promise<WeaponMastery>
  async getRecentMatches(shard: Shard, accountId: string, limit?: number): Promise<string[]>
}
```

### Rate Limit 관리
- `p-limit` 라이브러리로 동시 요청 제한 (concurrency: 3)
- 요청 간 최소 간격: 100ms
- 429 시 자동 재시도 (최대 3회, exponential backoff)

### 오류 처리
- 404: 플레이어 없음 → `PlayerNotFoundError`
- 429: Rate Limit → `RateLimitError` (retry 후에도 실패 시)
- 5xx: PUBG 서버 오류 → `PubgServerError`
- Zod validation fail → `PubgResponseParseError` (원본 로깅)

### MAP 이름 매핑 (constants.ts)
```typescript
const MAP_DISPLAY_NAMES = {
  'Baltic_Main': '에란겔',
  'Desert_Main': '미라마',
  'Savage_Main': '사녹',
  'DihorOtok_Main': '비켄디',
  'Kiki_Main': '데스턴',
  'Tiger_Main': '태이고',
  'Neon_Main': '론도',
  // ...
}
```

## 완료 조건

- [ ] 모든 Zod 스키마 정의 (PUBG API JSON:API 포맷 파싱)
- [ ] `PubgApiClient` 클래스 구현
- [ ] Rate Limit + 재시도 로직 동작 확인
- [ ] 단위 테스트: mock API 응답으로 Zod 파싱 검증
- [ ] 환경 변수 `PUBG_API_KEY` 누락 시 명확한 오류 메시지
- [ ] `packages/shared`에서 타입 export — api/web에서도 재사용 가능

## 의존성

- T-001 (모노레포 스캐폴딩)
- PUBG API 키 필요 (`PUBG_API_KEY` 환경 변수)
