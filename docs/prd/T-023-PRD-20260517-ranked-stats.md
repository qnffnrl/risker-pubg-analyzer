# T-023 PRD — 랭크 통계 (Ranked Stats)

**작성일**: 2026-05-17  
**상태**: 대기 (승인 전)  
**유형**: feat

---

## 목표

PUBG API의 랭크 전용 엔드포인트(`/seasons/{id}/ranked`)를 활용해 현재 시즌 랭크 티어, 랭크 포인트, 랭크 모드 전투 지표를 수집·표시한다.

---

## PUBG API

| 엔드포인트 | 용도 |
|-----------|------|
| `GET /shards/{shard}/seasons` | 시즌 목록 (현재 시즌 ID 추출) |
| `GET /shards/{shard}/players/{accountId}/seasons/{seasonId}/ranked` | 랭크 스탯 (tier, rankPoint, KDA, 승률 등) |

### 랭크 응답 구조 (`rankedGameModeStats`)
```
squad / squad-fpp 별로:
  currentTier: { tier: "Diamond", subTier: "1" }
  currentRankPoint: 3200
  bestTier / bestRankPoint
  roundsPlayed, wins, kills, deaths
  kda, kdr, damageDealt
  avgRank, top10Ratio, winRatio
  headshotKills, dBNOs, revives
```

---

## 변경 범위

### 1. `packages/shared` — Zod 스키마 추가
- `packages/shared/src/pubg/schemas/ranked.schema.ts` 신규
- `RankedTierSchema`, `RankedGameModeStatsSchema`, `PubgRankedStatsResponseSchema`

### 2. `apps/worker` — 수집
- `pubg-client.ts`: `getRankedStats(shard, accountId, seasonId)` 메서드 추가
- `playerFetch.processor.ts`: 현재 시즌 ID 조회 → 랭크 스탯 수집 → `ranked_stats` 테이블 upsert (weapon mastery와 동일한 non-fatal 패턴)

### 3. `packages/db` — 스키마 & 마이그레이션
- `ranked_stats` 테이블: `playerId(FK)`, `seasonId`, `rankedData(jsonb)`, `fetchedAt`

### 4. `apps/api` — 엔드포인트
- `GET /api/v1/players/:pubgId/ranked` → `{ rankedData, seasonId, fetchedAt }`

### 5. `apps/web` — UI
- `apps/web/src/lib/api.ts`: `getRankedStats()` 함수 + 타입 추가
- `apps/web/src/app/players/[pubgId]/ranked-view.tsx` 신규
- `player-tabs.tsx`: `'랭크'` 탭 추가
- `page.tsx`: `getRankedStats` 병렬 fetch 추가

---

## UI 구성

### 랭크 탭

**티어 카드** (상단)
```
[현재 티어]          [최고 티어]
💎 Diamond I         💎 Diamond I
3,200 RP             3,200 RP
```

**모드 선택 토글**: squad / squad-fpp

**지표 카드 그리드 (2×3)**
```
| 게임 수  | 승률    | KDA    |
| 평균순위 | 헤드샷% | 데미지/게임 |
```

**티어 진행 바**
- Bronze → Silver → Gold → Platinum → Diamond → Master
- 현재 포인트 위치 표시

---

## 완료 조건

- [ ] `ranked.schema.ts` Zod 스키마
- [ ] `getRankedStats()` pubg-client 메서드
- [ ] `ranked_stats` DB 테이블 + 마이그레이션
- [ ] playerFetch에서 현재 시즌 랭크 수집 (non-fatal)
- [ ] `GET /api/v1/players/:pubgId/ranked` API
- [ ] `RankedView` 컴포넌트 + 플레이어 탭 통합
- [ ] squad / squad-fpp 모드 토글
- [ ] 티어 배지 + 진행 바

## 의존성

- T-002 (DB 스키마 패턴)
- T-005 (playerFetch 수집 패턴 — weapon mastery와 동일)
- T-009 (PlayerTabs 탭 구조)
