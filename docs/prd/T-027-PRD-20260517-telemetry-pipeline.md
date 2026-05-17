# T-026 PRD — 텔레메트리 수집/저장 파이프라인

**작성일**: 2026-05-17
**상태**: 대기 (승인 전)
**유형**: feat

---

## 배경

현재 분석은 PUBG API의 `match.included.participant.stats` (매치당 본인의 집계 스탯)만 사용한다. PUBG는 매치마다 **텔레메트리(Telemetry) JSON URL**을 함께 제공하는데(이미 `matches.included_data`의 `asset.attributes.URL`에 추출 가능, `apps/api/src/routes/v1/matches.ts:93` 참조), 이 텔레메트리에는 `LogPlayerKillV2`, `LogPlayerTakeDamage`, `LogPlayerPosition`, `LogGameStatePeriodic` 등 **이벤트 단위 데이터**가 들어있다.

집계 스탯만으로는 다음과 같은 "실력 향상에 직접적인 신호"를 만들 수 없다:
- 첫 교전 시각 / 첫 교전 후 생존시간
- 받은 데미지의 방향 분포 (후방 피격 비율)
- 킬/데스 좌표 (히트맵)
- 자기장 페이즈별 위치/데미지 분포
- 무기별 실제 킬 거리

본 PRD는 텔레메트리 다운로드 → 저장 → 파싱의 기반 파이프라인만 다룬다. 신규 분석 지표 자체는 후속 PRD(T-027 약점 룰 엔진, T-028 데스 히트맵, T-029 성향 축 리팩토링)에서 정의한다.

---

## 데이터 전략

### 저장 방식: raw JSON 별도 테이블 + 분석 시점 in-memory 파싱

대안 두 가지를 검토했다:

| 안 | 장점 | 단점 |
|---|---|---|
| **A. raw JSON 통째 저장** (채택) | 새 분석 추가 시 백필 불필요. 디스크 비용 저렴. | 매 분석마다 파싱 비용. |
| B. 이벤트 분해 후 정규화 테이블 | 쿼리 빠름. | 새 신호 추가할 때마다 마이그레이션/백필 필요. 텔레메트리는 매치당 수MB라 분해 시 row가 폭증. |

**결정**: A안. 매치 raw가 이미 `matches.included_data`에 저장되어 있는 기존 패턴(T-024)과 일관성이 있다. 텔레메트리도 같은 방식으로 jsonb에 저장하고, gzip 압축은 PostgreSQL TOAST의 기본 동작에 맡긴다.

### 텔레메트리 특성

- 인증: 불필요 (CDN URL 직접 다운로드)
- 크기: 매치당 500KB ~ 수 MB (gzip 응답 가능 — `Accept-Encoding: gzip` 헤더)
- Rate limit: 없음 (PUBG API 본체와 별도)
- 불변: 한번 받으면 재요청 불필요

---

## 변경 범위

### 1. `packages/db` — 스키마 & 마이그레이션

`match_telemetry` 신규 테이블 (matches와 1:1):

```sql
-- migration 0005_match_telemetry.sql
CREATE TABLE match_telemetry (
  match_id       uuid PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  payload        jsonb NOT NULL,
  event_count    integer,
  fetched_at     timestamptz NOT NULL DEFAULT now(),
  payload_bytes  integer
);
CREATE INDEX idx_match_telemetry_fetched_at ON match_telemetry(fetched_at);
```

`matches` 본체와 분리하는 이유: 텔레메트리는 매우 크고, 모든 쿼리에서 필요하지 않다. 매치 목록/상세 조회 시 JOIN 비용을 피하기 위함.

### 2. `apps/worker` — PUBG 클라이언트 + 처리기

#### `lib/pubg-client.ts`
- `getTelemetry(url: string): Promise<TelemetryEvent[]>` 메서드 추가
  - URL은 PUBG asset의 `attributes.URL` (이미 추출됨)
  - `Authorization` 헤더 **없이** 호출 (CDN URL이라 키 불필요)
  - `Accept: application/vnd.api+json`, `Accept-Encoding: gzip`
  - 응답은 이벤트 배열 → Zod로 *느슨하게* 검증 (이벤트 종류가 많고 PUBG가 자주 추가하므로 unknown fields 허용)
- 텔레메트리는 별도 호스트 → 기존 `throttle()`/`pLimit`과 무관하게 자체 동시성 제어 (`pLimit(2)` 정도)
- 재시도: 5xx만 재시도, 4xx는 즉시 실패

#### `lib/analysis/telemetry/types.ts` (신규)
이벤트 타입별 Zod 스키마. 최소한 다음 5개는 정의:
- `LogMatchStart` — 매치 시작 시각, 맵, 모드
- `LogPlayerKillV2` — killer/victim accountId + location, weapon, distance, isHeadshot
- `LogPlayerTakeDamage` — attacker/victim, damage, damageReason, damageTypeCategory
- `LogPlayerPosition` — accountId, location, elapsed (매 10초 단위)
- `LogGameStatePeriodic` — bluezone 위치/반지름, 페이즈

```typescript
const EventBaseSchema = z.object({
  _T: z.string(),                  // 이벤트 타입
  _D: z.string().datetime(),       // ISO timestamp
  common: z.object({...}).passthrough(),
}).passthrough()
```

`.passthrough()`로 unknown 필드 허용. 모르는 `_T`는 그냥 drop.

#### `processors/matchCollection.processor.ts` 수정
기존 매치 수집 루프 끝에 텔레메트리 수집 단계 추가:
1. `match.included`에서 `asset.attributes.URL` 추출
2. `match_telemetry` 테이블에 이미 있으면 스킵
3. `pubg.getTelemetry(url)` 호출 → `match_telemetry` 테이블에 upsert (`payload`, `event_count`, `payload_bytes`)
4. 실패해도 매치 수집은 성공 처리 (텔레메트리는 분석 부가물이므로 best-effort)

#### `lib/analysis/telemetry/loader.ts` (신규)
```typescript
async function loadTelemetry(matchId: string): Promise<TelemetryEvent[]>
async function loadTelemetryForPlayer(playerId: string, limit: number): Promise<Map<matchId, TelemetryEvent[]>>
```
이벤트 배열을 in-memory에 펼쳐 반환. 호출자(약점 룰 엔진, 히트맵 생성기)가 그 위에서 집계.

### 3. `apps/api` — 디버깅 엔드포인트만

분석용 신규 API는 본 PRD 범위 밖. 대신 관리자 페이지(T-018)에서 텔레메트리 수집 현황 확인용으로:

- `GET /api/v1/admin/telemetry/stats` → `{ totalMatches, withTelemetry, totalPayloadMB }`

### 4. `apps/web` — 변경 없음

본 PRD는 백엔드 기반 작업. UI 변경은 후속 PRD에서.

---

## 동시성 / 부하 고려

매치 20개 수집 시 텔레메트리 다운로드도 20회 발생:
- 평균 1MB × 20 = 20MB / 사용자 검색
- 평균 응답 시간 1~3초 × 동시성 2 = 약 20~30초 추가 소요

매치 수집 job 안에서 동기 처리하면 사용자 대기시간이 길어진다.

**선택**: 텔레메트리 수집을 **별도 BullMQ 큐 `telemetry-fetch`** 로 분리.
- `matchCollection.processor`에서 매치 저장 직후 텔레메트리 job enqueue
- `analysis.processor`는 텔레메트리 없어도 기존 4축 점수는 계산 가능 (graceful degrade)
- 텔레메트리 기반 분석(T-027~)은 텔레메트리 도착 후 별도 분석 트리거 또는 사용자 재요청 시 활용

```typescript
// 큐 설정
telemetry-fetch: concurrency 4, attempts 2, removeOnComplete 200
```

---

## 디스크 사용량 추정

| 항목 | 추정값 |
|---|---|
| 매치당 텔레메트리 (gzip 전) | 1~3MB |
| 매치당 텔레메트리 (PostgreSQL TOAST 후) | 200~600KB |
| 100명 × 20매치 = 2000매치 | 약 400MB~1.2GB |
| 1000명 × 20매치 = 20000매치 | 약 4~12GB |

초기 운영에는 문제 없음. 추후 90일 이상 미접근 매치 텔레메트리는 정리 cron으로 삭제 가능 (별도 운영 작업, 본 PRD 범위 밖).

---

## 완료 조건

- [ ] `match_telemetry` 테이블 + 마이그레이션 `0005_match_telemetry.sql`
- [ ] `PubgApiClient.getTelemetry(url)` 구현 + Zod 스키마 (passthrough)
- [ ] `telemetry-fetch` BullMQ 큐 + 프로세서
- [ ] `matchCollection.processor`에서 텔레메트리 job enqueue (best-effort)
- [ ] `lib/analysis/telemetry/loader.ts` (matchId/playerId 기준 로더)
- [ ] `LogPlayerKillV2`, `LogPlayerTakeDamage`, `LogPlayerPosition`, `LogGameStatePeriodic`, `LogMatchStart` 이벤트 타입 정의
- [ ] 텔레메트리 다운로드 실패 시 매치 수집은 성공 처리되는지 확인
- [ ] Bull Board에서 `telemetry-fetch` 큐 모니터링 가능
- [ ] `GET /api/v1/admin/telemetry/stats` (관리자 페이지에서 참조)

## 비완료 (후속 PRD 범위)

- 텔레메트리를 활용한 새 분석 지표 → T-027 (약점 룰 엔진)
- 데스/킬 히트맵 시각화 → T-028
- 4축 성향 리팩토링 → T-029
- 텔레메트리 정리 cron → 운영 작업

## 의존성

- T-005 (matchCollection 패턴)
- T-024 (matches.included_data 컬럼 — asset URL 출처)
