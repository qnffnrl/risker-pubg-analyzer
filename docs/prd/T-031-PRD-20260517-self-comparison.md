# T-030 PRD — 자가 비교 (과거의 나 vs 현재의 나)

**작성일**: 2026-05-17
**상태**: 대기 (승인 전)
**유형**: feat

---

## 배경

비교 페이지(T-013)는 두 닉네임을 입력해 1:1 비교한다. 그러나 실력 향상 측면에서 가장 중요한 비교는 **타인 vs 나**가 아니라 **과거의 나 vs 현재의 나**다.

- 약점 카드(T-027)에서 "지난주 약점이 이번주에 개선됐는지" 추적 불가
- 새 점수(T-029)가 적용된 후 "스타일이 변했는지" 보고 싶어도 시점별 스냅샷 없음

현재 `play_style_analyses` 테이블은 **playerId 단일 unique** 라서 분석할 때마다 덮어쓴다. 시계열이 보존되지 않음.

본 PRD는 분석 결과의 시계열 보존 + 자가 비교 UI를 추가한다. T-017(성과 추이 차트)은 매치 단위 시계열을 다루는 반면 본 PRD는 **분석 스냅샷 단위**를 다룬다 (서로 보완).

---

## 데이터 구조 변경

### 현재
```
play_style_analyses (playerId PK)
  매번 upsert로 덮어쓰기
```

### 변경
```
play_style_analyses          ← 캐시 (현재 분석, upsert)
play_style_snapshots (신규)  ← 시계열 (분석마다 insert)
```

`play_style_analyses`는 캐시 의미로 그대로 두고, 분석 완료 시 별도로 `play_style_snapshots`에 **insert만** 한다. 캐시는 빠른 조회용, 스냅샷은 추이용 — 책임 분리.

```sql
-- migration 0009_snapshots.sql
CREATE TABLE play_style_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  match_count integer NOT NULL,
  match_id_range jsonb,           -- { from: matchId, to: matchId } 분석 대상 매치 식별

  -- 점수 (v1 + v2 둘 다 보존, T-029와 일관)
  score_version varchar(8) NOT NULL,
  aggression_score numeric(5,2),
  survival_score numeric(5,2),
  positioning_score numeric(5,2),
  teamplay_score numeric(5,2),
  skill_score numeric(5,2),

  -- 메트릭 jsonb (현재 분석과 동일 구조)
  aggression_metrics jsonb,
  survival_metrics jsonb,
  positioning_metrics jsonb,
  teamplay_metrics jsonb,

  -- 약점 (T-027)
  top_weakness jsonb,
  all_weaknesses jsonb,

  -- 메타
  llm_summary text
);

CREATE INDEX idx_snapshots_player_time ON play_style_snapshots(player_id, analyzed_at DESC);
```

### 스냅샷 생성 정책

매 분석마다 무조건 insert하면 같은 매치 셋으로 여러 스냅샷이 생긴다 (예: 사용자가 새로고침 버튼 연타).

**규칙**: 직전 스냅샷 대비 *분석 대상 매치 셋의 30% 이상이 새로운 매치*일 때만 insert.

```typescript
// apps/worker/src/processors/analysis.processor.ts 에서
const prev = await getLatestSnapshot(playerId);
if (prev) {
  const newMatchRatio = newMatchesNotInPrev / currentMatchCount;
  if (newMatchRatio < 0.3) {
    // 같은 데이터 분석 → 캐시만 갱신, 스냅샷은 skip
    return updateCacheOnly(...);
  }
}
await insertSnapshot(...);
```

이러면 사용자가 일주일에 5게임만 했어도 새 분석 트리거 시 스냅샷이 늘지 않고, 충분한 새 매치가 쌓였을 때만 새 스냅샷이 추가됨.

### 스냅샷 보관 정책

- 무제한 보관 (한 사용자당 평균 월 4~8개 추정 → 1년 50~100 row, 무시 가능한 크기)
- 90일 이상 미접속 사용자의 스냅샷은 정리 cron으로 삭제 가능 (운영 작업, 본 PRD 범위 밖)

---

## API

### 신규: `GET /api/v1/players/:id/snapshots`

```typescript
// Query params
{
  limit?: number    // 기본 20
  before?: string   // ISO timestamp, 페이지네이션
}

// Response
{
  snapshots: Array<{
    id: string;
    analyzedAt: string;
    matchCount: number;
    scoreVersion: 'v1' | 'v2';
    scores: {
      aggression: number;
      survival: number;
      positioning: number;
      teamplay: number;
      skill: number;
    };
    topWeakness: WeaknessFinding | null;
  }>
}
```

목록은 항목당 작게 (위에 정의된 정도) — 상세 메트릭은 별도 엔드포인트.

### 신규: `GET /api/v1/players/:id/snapshots/compare?from=<id>&to=<id>`

두 스냅샷의 모든 메트릭을 한 번에 반환 (UI에서 diff 계산용).

```typescript
{
  from: SnapshotFull;
  to: SnapshotFull;
  diff: {
    aggression: number;    // to - from
    survival: number;
    positioning: number;
    teamplay: number;
    skill: number;
  };
  weaknessProgress: {
    fromWeaknessId: string;
    fixedInTo: boolean;    // from의 약점이 to에서 해소됐는지
    severityChange: number; // to에서 같은 룰의 severity - from severity
  };
}
```

---

## UI

### A. 분석 대시보드 상단 — 미니 추이 위젯

`/players/[id]` 페이지 상단, 레이더 차트 옆 또는 위에 작은 카드:

```
┌─ 한달 전과 비교 ─────────────────────────────┐
│   공격성  72 → 78    (+6) 📈                 │
│   생존형  45 → 52    (+7) 📈                 │
│   포지셔닝 60 → 58   (-2) 📉                 │
│   팀플레이 80 → 79   (-1) ―                  │
│                                              │
│   [전체 추이 보기 →]                          │
└─────────────────────────────────────────────┘
```

- 한달 전 스냅샷이 없으면 가장 오래된 스냅샷과 비교
- 스냅샷이 1개뿐이면 위젯 숨김 (또는 "더 많은 분석 후 변화를 추적할 수 있습니다")

### B. 신규 페이지 — `/players/[id]/history`

세로 타임라인 형태:

```
2026-05-17 분석 (20매치)
├─ 공격성 78 / 생존형 52 / 포지셔닝 58 / 팀플 79 / 실력 71
├─ 🔴 이번 약점: 자기장 늦진입 (강도 0.6)
└─ [상세 보기]

2026-05-03 분석 (20매치)
├─ 공격성 72 / 생존형 45 / 포지셔닝 60 / 팀플 80 / 실력 68
├─ 🟠 그때 약점: 회복템 미사용 (강도 0.5)
│  → 이번 분석에서 해소됨 ✓
└─ [상세 보기]

2026-04-20 분석 (15매치)
├─ ...
```

- 약점의 "해소 여부"는 비교 API의 `weaknessProgress.fixedInTo`로 표시
- 각 스냅샷 카드를 두 개 선택 → "두 스냅샷 비교" 버튼 활성화 → 비교 페이지로

### C. 비교 페이지 확장 (T-013과 통합)

기존 비교 페이지는 닉네임 1 vs 닉네임 2. 여기에 모드 추가:

```
비교 모드: [닉네임 vs 닉네임] [내 과거 vs 내 현재]
```

"내 과거 vs 내 현재" 선택 시 닉네임 입력 하나만, 스냅샷 두 개 선택. 같은 레이더 차트 오버레이 컴포넌트 재사용.

---

## 약점 진행도 추적

T-027에서 약점 룰은 ID(`R001`, `R101` 등)를 가지므로, 스냅샷 간 같은 ID의 severity 변화를 추적할 수 있다:

```
지난 분석 약점:  R104 자기장 외곽 점유 (severity 0.7)
↓
이번 분석 같은 룰:  R104 발동 안 함 (severity 0)
→ "지난 약점이 해소되었습니다 ✓"
```

또는 일부 개선:
```
지난: R104 (0.7) → 이번: R104 (0.4)
→ "약점이 줄어들고 있습니다 (0.7 → 0.4)"
```

UI에서는 다음 컴포넌트로:

```
┌─ 지난 분석의 약점 추적 ───────────────────────┐
│  자기장 외곽 점유                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  강도: 0.70  →  0.40   (43% 감소) ✓          │
│  계속 같은 방향으로 가고 있어요!                │
└─────────────────────────────────────────────┘
```

---

## 동작 안 함 케이스

- 스냅샷 0개: 첫 분석. 위젯/페이지 숨김 또는 "다음 분석 후 변화를 볼 수 있습니다" 안내.
- 스냅샷 1개: 비교 불가, 단일 카드만 표시.
- 30% 매치 차이 안 나는 분석 연속 실행: 캐시 갱신만 하고 스냅샷은 안 늘림.
- v1과 v2 스냅샷 혼재: 같은 버전끼리만 점수 비교, 다른 버전이면 "분석 방식이 변경되어 직접 비교 불가" 표시 + 약점 ID는 버전 무관하게 추적 가능 (룰 ID는 v1/v2 영향 받지 않음).

---

## 완료 조건

- [ ] migration 0009: `play_style_snapshots` 테이블
- [ ] `analysis.processor`에서 스냅샷 insert 로직 + 30% 매치 신규성 체크
- [ ] `GET /api/v1/players/:id/snapshots` (목록)
- [ ] `GET /api/v1/players/:id/snapshots/compare?from=&to=` (비교)
- [ ] 분석 대시보드 상단 "한달 전과 비교" 미니 위젯
- [ ] `/players/[id]/history` 페이지 (타임라인)
- [ ] 비교 페이지에 "내 과거 vs 내 현재" 모드 추가
- [ ] 약점 ID 기준 진행도 추적 컴포넌트
- [ ] v1/v2 스냅샷 혼재 케이스 처리
- [ ] 스냅샷 0개/1개 케이스 처리

## 의존성

- T-006 (분석 엔진 — 스냅샷 데이터 출처)
- T-013 (비교 페이지 — 모드 추가 통합)
- T-027 (약점 룰 엔진 — 진행도 추적)
- T-029 (점수 v2 — 같은 버전끼리만 비교)

## 비완료 (후속 운영/PRD)

- 스냅샷 정리 cron (운영 작업)
- 약점 해소 시 알림/배지 시스템
- 친구/팀원과 함께 추적 (소셜)
