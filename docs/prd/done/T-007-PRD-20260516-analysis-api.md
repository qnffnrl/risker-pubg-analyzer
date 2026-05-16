# T-007 PRD — 분석 결과 API (Hono Backend)

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

플레이어 검색, 분석 트리거, 결과 조회를 위한 REST API를 Hono로 구현한다.
트래픽 로깅 미들웨어도 이 태스크에서 구현한다.

## API 엔드포인트

### 플레이어

```
GET  /health
→ { status: "ok", timestamp: "...", version: "..." }

POST /api/v1/players/search
Body: { nickname: string, platform: "steam"|"kakao"|"console" }
→ { jobId: string, playerId?: string, cached: boolean }
  - 캐시 히트 시 cached: true + 분석 결과 바로 반환
  - 캐시 미스 시 BullMQ 잡 생성 + jobId 반환

GET  /api/v1/players/search?nickname={name}&platform={platform}
→ 위와 동일 (GET 방식 지원)

GET  /api/v1/players/{pubgId}
→ { player: Player, latestAnalysis: PlayStyleAnalysis | null }

GET  /api/v1/players/{pubgId}/analysis
→ 최신 분석 결과 (play_style_analyses 최신 1건)

GET  /api/v1/players/{pubgId}/matches?limit=20&offset=0
→ 최근 매치 목록 + 각 매치별 stats

POST /api/v1/players/{pubgId}/refresh
→ forceRefresh: true로 재수집 + 재분석 트리거
```

### 잡 상태

```
GET  /api/v1/jobs/{jobId}/status
→ {
    status: "pending"|"processing"|"completed"|"failed",
    progress: number,  // 0~100
    result?: { playerId: string },
    error?: string
  }
```

### 비교 (T-013용 사전 구현)

```
GET  /api/v1/compare?players={id1},{id2}
→ { players: [Analysis, Analysis] }
```

## 미들웨어

### 트래픽 로깅 미들웨어
```typescript
// 모든 요청에 대해 traffic_logs 테이블에 기록
{
  path, method, status_code, ip_address,
  user_agent, duration_ms, searched_player
}
```
- 비동기 삽입 (응답 지연 없음)
- PII 주의: IP는 로깅하되 마스킹 옵션 제공 (`X-Forwarded-For` 처리)

### CORS 미들웨어
- `https://pubg.risker.co.kr` 허용
- 로컬 개발: `http://localhost:3000` 허용

### Rate Limit 미들웨어 (선택)
- IP당 분당 30 요청 제한
- Redis 기반 (ioredis)

## 응답 형식

```typescript
// 성공
{ data: T, meta?: { cached: boolean, cachedAt?: string } }

// 에러
{ error: { code: string, message: string } }
// code 예시: "PLAYER_NOT_FOUND", "RATE_LIMITED", "ANALYSIS_IN_PROGRESS"
```

## 파일 구조

```
apps/api/src/
  routes/
    health.ts
    players.ts
    jobs.ts
    compare.ts
  middleware/
    trafficLogger.ts
    cors.ts
    rateLimit.ts
    errorHandler.ts
  lib/
    db.ts          # Drizzle 클라이언트
    redis.ts       # BullMQ 큐 연결
    cache.ts       # 캐시 헬퍼
  index.ts         # Hono 앱 + 서버 시작
```

## 완료 조건

- [ ] 모든 엔드포인트 구현 + Zod 입력 검증
- [ ] 트래픽 로깅 미들웨어 동작 확인 (DB 저장)
- [ ] 캐시 히트/미스 로직 동작
- [ ] BullMQ 잡 생성 + 상태 폴링 E2E 동작
- [ ] CORS 설정 완료
- [ ] OpenAPI 스펙 자동 생성 (`@hono/zod-openapi` 활용)

## 의존성

- T-001 (모노레포 스캐폴딩)
- T-002 (DB 스키마)
- T-005 (Worker 큐 — 잡 생성)
- T-006 (분석 엔진 — 결과 조회)
