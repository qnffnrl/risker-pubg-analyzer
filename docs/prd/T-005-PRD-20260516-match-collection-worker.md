# T-005 PRD — 플레이어 검색 + 매치 수집 Worker

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

BullMQ 큐를 통해 플레이어 닉네임 검색 → 매치 수집 → DB 저장 파이프라인을 구현한다.
캐시 전략으로 동일 플레이어 중복 수집을 방지한다.

## 큐 설계

### Queue: `player-fetch` (플레이어 조회)
**Job payload:**
```typescript
{
  nickname: string
  platform: 'steam' | 'kakao' | 'console'
  requestedAt: string  // ISO timestamp
}
```
**처리:**
1. PUBG API로 플레이어 ID 조회
2. `players` 테이블 upsert
3. `match-collection` 큐에 후속 잡 생성

### Queue: `match-collection` (매치 수집)
**Job payload:**
```typescript
{
  playerId: string   // DB uuid
  pubgAccountId: string
  platform: string
  matchLimit: number  // 기본 20
  forceRefresh: boolean
}
```
**처리:**
1. 캐시 체크 — `play_style_analyses.expires_at` > now() 이면 스킵
2. PUBG API에서 최근 N개 매치 ID 목록 조회
3. 각 매치 상세 조회 (배치, concurrency 제한)
4. `matches`, `player_match_stats` upsert
5. `analysis` 큐에 후속 잡 생성

### Queue: `analysis` (분석 연산 — T-006에서 구현)
**Job payload:**
```typescript
{
  playerId: string
  matchIds: string[]
}
```

## 캐시 전략

- 분석 결과 TTL: **24시간** (기본값, 환경 변수로 조정 가능)
- TTL 내 같은 플레이어 재요청 → 캐시된 분석 결과 즉시 반환
- 강제 새로고침: `forceRefresh: true` (API에서 트리거 가능)

## BullMQ 설정

```typescript
// 큐 공통 옵션
defaultJobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,  // 완료 잡 100개 보존
  removeOnFail: 50,
}

// 동시성
player-fetch: concurrency 5
match-collection: concurrency 2  // Rate Limit 고려
analysis: concurrency 4
```

## 파일 구조

```
apps/worker/src/
  queues/
    playerFetch.queue.ts    # 큐 인스턴스 + 잡 타입
    matchCollection.queue.ts
    analysis.queue.ts
  processors/
    playerFetch.processor.ts
    matchCollection.processor.ts
    analysis.processor.ts   # T-006에서 구현
  lib/
    pubg-client.ts         # T-004
    db.ts                  # Drizzle 클라이언트
  worker.ts               # 엔트리포인트 (모든 워커 등록)
  bullboard.ts            # Bull Board 디버깅 UI
```

## API 연동 (apps/api)

Worker 큐에 잡을 추가하는 것은 API에서 담당:
```
POST /api/v1/players/search
→ player-fetch 큐에 잡 추가
→ job ID 반환 (폴링용)

GET /api/v1/jobs/{jobId}/status
→ 잡 진행 상태 반환
```

## 완료 조건

- [ ] 3개 큐 BullMQ 정의 + 프로세서 연결
- [ ] 플레이어 검색 → 매치 수집 전체 파이프라인 E2E 동작
- [ ] `players` + `matches` + `player_match_stats` DB 저장 확인
- [ ] 캐시 히트 시 중복 수집 스킵 동작
- [ ] 에러 시 DLQ(Dead Letter Queue) 처리 + 로깅
- [ ] Bull Board UI (`http://localhost:3001/admin/queues`) 접속 확인
- [ ] 동일 닉네임 동시 요청 중복 처리 방지

## 의존성

- T-001 (모노레포 스캐폴딩)
- T-002 (DB 스키마)
- T-004 (PUBG API 클라이언트)
