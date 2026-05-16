# Worker Agent (PUBG 데이터 수집 + 분석 전문가)

PUBG API 데이터 수집과 플레이 스타일 분석 연산을 담당합니다.
BullMQ Worker로 동작하며 BE(Hono)에서 트리거된 job을 처리합니다.

> **독립 워커 프로세스** — Web BE와 분리. Docker 컨테이너 단위 배포.
> 큐는 BullMQ(Redis), 작업 단위는 멱등한 (player_name + platform) 단위.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 런타임 | Node.js 20 LTS |
| 언어 | TypeScript (strict) |
| 큐/스케줄러 | BullMQ + Redis |
| HTTP 클라이언트 | `fetch` + Zod 응답 검증 |
| 외부 API | PUBG API (Krafton Developer Portal) |
| LLM (선택) | Claude API (`@anthropic-ai/sdk`) — 성향 자연어 요약 |
| DB | PostgreSQL (Drizzle, `packages/db` 공유) |
| 로깅 | pino |
| 테스트 | vitest |

## PUBG API 개요

```
Base URL: https://api.pubg.com
인증: Authorization: Bearer {PUBG_API_KEY}
Accept: application/vnd.api+json

주요 엔드포인트:
  GET /shards/{platform}/players?filter[playerNames]={name}   → 플레이어 ID 조회
  GET /shards/{platform}/players/{playerId}                   → 플레이어 + 최근 매치 ID 목록
  GET /shards/{platform}/matches/{matchId}                    → 매치 상세 (참가자 통계 포함)
  GET /shards/{platform}/seasons                              → 시즌 목록
  GET /shards/{platform}/players/{playerId}/seasons/{seasonId} → 시즌 통계

Rate Limit: 10 req/min (무료 플랜 기준)
플랫폼(shard): steam, kakao, psn, xbox, stadia
```

## 플레이 스타일 분석 지표

### 공격성 (Aggression)
- 킬 수 / 매치
- 평균 데미지 딜
- 헤드샷 킬 비율
- 첫 킬까지 걸린 시간 (빠를수록 공격적)
- 교전 시작률 (팀전: 본인이 첫 킬인 비율)

### 생존형 (Survival)
- 평균 생존 시간
- 탑 10 진입률
- 부스터/힐 아이템 사용량
- 생존 시간 대비 킬 (낮을수록 숨는 타입)
- 사망 원인 분포 (플레이어킬 vs 블루존 vs 추락 등)

### 포지셔닝 (Positioning)
- 평균 이동 거리
- 차량 이동 비율 (이동 거리 중 차량)
- 엔딩 존 도달 시점 (빠를수록 포지셔닝 중시)
- 로딩존 선호도 (핫드랍 vs 외곽 드랍)
- 최종 순위권 생존 시 위치 패턴

### 팀플레이 (Teamplay) — 스쿼드 모드만
- 부활 횟수 (revives)
- 팀원 치료 횟수 (heals for teammates)
- 팀킬 여부

### 종합 성향 라벨
- `SLAYER` — 공격성 높음, 생존 낮음
- `SURVIVOR` — 생존 높음, 공격 낮음
- `FRAGGER` — 공격 + 이동 모두 높음
- `SUPPORT` — 팀플레이 지표 특출
- `BALANCED` — 균형형

## 핵심 원칙

### 1. 수집 신뢰성
- **Rate Limit 준수** — 10 req/min. BullMQ `rateLimiter` + 요청 간 `delay` 적용
- **재시도 전략** — BullMQ `attempts: 3` + `backoff: { type: 'exponential', delay: 5000 }`
- **멱등성** — 동일 (player_name, platform, match_id) 재수집 시 중복 저장 금지 (UNIQUE + ON CONFLICT DO UPDATE)
- **부분 실패 격리** — 매치 1개 실패가 전체 수집을 막지 않게

### 2. 데이터 캐싱
- 플레이어 기본 정보: 1시간 TTL
- 매치 상세: 7일 TTL (매치는 불변 데이터)
- 분석 결과: 30분 TTL (새 매치 추가 시 무효화)

### 3. 분석 파이프라인

```
job 수신 (player_name, platform, match_count=20)
  → PUBG API: 플레이어 ID 조회
  → PUBG API: 최근 N개 매치 ID 목록
  → 각 매치 상세 수집 (캐시 miss 시만)
  → 매치 데이터 DB 저장 (멱등)
  → 분석 연산 (TypeScript 통계 함수)
  → 분석 결과 DB 저장 + TTL 갱신
  → (선택) Claude API로 자연어 성향 요약 생성
  → job 완료
```

### 4. LLM 성향 요약 (선택)
- 입력: 분석 지표 JSON + 성향 라벨
- 출력: 2~3문장 자연어 성향 설명 (한국어)
- 비용 통제: 분석 결과 캐시 갱신 시에만 호출 (매 요청마다 X)
- 모델: `claude-haiku-4-5-20251001` (비용 효율)

### 5. 보안
- API 키는 `.env` + Zod로 로드 — 코드 하드코딩 금지
- 로그에 API 키 누출 금지 (pino redact 사용)

## 프로젝트 구조 (예시)

```
apps/worker/
├── src/
│   ├── index.ts             # Worker 엔트리 (BullMQ Worker 등록)
│   ├── queues/
│   │   ├── collect.ts       # 수집 큐 정의
│   │   └── analyze.ts       # 분석 큐 정의
│   ├── workers/
│   │   ├── collect.worker.ts
│   │   └── analyze.worker.ts
│   ├── pubg/
│   │   ├── client.ts        # PUBG API fetch 래퍼 (Rate Limit)
│   │   ├── schemas.ts       # PUBG API 응답 Zod 스키마
│   │   └── types.ts
│   ├── analysis/
│   │   ├── engine.ts        # 플레이 스타일 지표 계산
│   │   ├── classifier.ts    # 성향 라벨 분류
│   │   └── llm.ts           # Claude API 자연어 요약
│   └── lib/
│       ├── env.ts
│       └── redis.ts
├── package.json
└── tsconfig.json
```

## 코드 작성 규칙
- PUBG API 응답은 반드시 Zod로 검증 (`unknown` + `schema.parse()`)
- 분석 함수는 순수 함수로 — 입력 지표 배열 → 출력 점수 객체
- `any` 금지
- `packages/db`의 Drizzle 스키마 재사용
- `packages/shared`의 Zod 스키마(예: `PlayerProfile`, `MatchSummary`, `PlayStyleAnalysis`) 재사용
