# T-024 PRD — 매치 상세 페이지

**작성일**: 2026-05-17  
**상태**: 대기 (승인 전)  
**유형**: feat

---

## 배경

현재 매치 카드는 본인 스탯만 표시. 매치 상세 페이지에서 전체 참가자·팀 구성·텔레메트리 URL까지 볼 수 있도록 한다.

## 데이터 전략

`matches.raw_data`에는 `match.data`(attributes)만 저장됨. `included`(participants, rosters, asset)는 미저장.

→ **On-demand fetch** 방식 채택: 매치 상세 조회 시 PUBG API에서 재요청. 매치 데이터는 불변이므로 `matches` 테이블에 `included_data jsonb` 컬럼 추가해 **첫 조회 시 DB에 캐싱**, 이후 DB에서 서빙.

---

## 변경 범위

### 1. `packages/db` — 스키마 & 마이그레이션
- `matches` 테이블에 `included_data jsonb` 컬럼 추가 (nullable)
- migration `0004_match_included.sql`

### 2. `apps/api` — 엔드포인트
- `GET /api/v1/matches/:matchId`
  1. `matches.included_data` 있으면 DB에서 반환 (캐시 히트)
  2. 없으면 PUBG API `getMatch()` 호출 → `included_data` 저장 → 반환
  - 응답: `{ match, participants, rosters, telemetryUrl }`
  - `participants`: 전체 참가자 배열 (name, playerId, kills, assists, damage, walkDistance, rideDistance, swimDistance, timeSurvived, winPlace, headshotKills, roadKills, heals, boosts, weaponsAcquired, DBNOs)
  - `rosters`: 팀 배열 (rank, teamId, participantIds)
  - `telemetryUrl`: asset URL

### 3. `apps/worker` — matchCollection 최적화
- `matchCollection.processor.ts`에서 이미 `matchResponse.included`를 갖고 있음
- upsert 시 `included_data`도 함께 저장 → 상세 조회 시 API 재호출 불필요

### 4. `apps/web` — UI
- `apps/web/src/lib/api.ts`: `getMatchDetail()` + 타입 추가
- `apps/web/src/app/matches/[matchId]/page.tsx` 신규 (SSR)
- `MatchCard`에 "상세 보기" 링크 추가

---

## UI 구성

### `/matches/[matchId]` 페이지

**헤더 카드**
```
[에란겔] DUO · 27분 · 100명 · 2026-05-17 23:44
isCustomMatch: false  matchType: official
```

**나의 스탯 하이라이트** (상단 고정)
```
킬 3  데미지 450  순위 #12  생존 22분
```

**팀 순위표** (테이블)
```
순위 | 팀 | 킬 합산 | 플레이어
 1  |  1 |   8    | PlayerA, PlayerB
 2  |  7 |   5    | PlayerC, PlayerD
...
```

**전체 참가자 테이블** (정렬 가능: 킬/데미지/순위)
```
닉네임 | 순위 | 킬 | 데미지 | 생존 | 도보 | 차량
```

**텔레메트리 URL** (복사 버튼)

---

## 완료 조건

- [ ] `matches.included_data` 컬럼 + 마이그레이션
- [ ] worker matchCollection에서 included_data 저장
- [ ] `GET /api/v1/matches/:matchId` (DB 캐시 → PUBG API fallback)
- [ ] `/matches/[matchId]` SSR 페이지
- [ ] 참가자 테이블 (킬/데미지/순위 정렬)
- [ ] 팀 구성 표시
- [ ] 텔레메트리 URL 복사 버튼
- [ ] MatchCard → 상세 링크

## 의존성

- T-005 (matchCollection 패턴)
- T-009 (플레이어 프로필 매치 카드)
