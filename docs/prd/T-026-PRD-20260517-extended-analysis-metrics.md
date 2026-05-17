# T-026 PRD — 플레이 스타일 분석 지표 고도화

> 작성일: 2026-05-17  
> 상태: 📋 대기  
> 유형: feat + fix

---

## 배경 & 목적

현재 분석 엔진은 공격성/생존/포지셔닝/팀플 4개 카테고리, 총 ~16개 지표로만 구성되어 있다.
"게임 실력 개선"을 위한 피드백 관점에서 다음 문제가 있다:

- **마무리 능력** 측정 불가 (넉다운 후 킬 완성율 없음)
- **시간 효율** 측정 불가 (분당 데미지, 생존 비율 없음)
- **일관성** 측정 불가 (운빨 vs 실력 구분 안 됨)
- **결정력(Clutch)** 측정 불가 (top10에서 우승하는 능력 없음)
- PNG 다운로드 버튼이 서버에서 동작하지 않음 (404)

---

## 범위

### Fix 1: PNG 다운로드 버그 수정 (OG 라우트 경로 충돌)

**근본 원인**: 호스트 레벨 Nginx가 `/api/*` 패턴을 Hono 백엔드(8081)로 라우팅.
Next.js의 `app/api/og/route.tsx`가 `/api/og` 경로에 있어서 Hono로 전달됨 → 404.

**수정 내용**:
1. `apps/web/src/app/api/og/route.tsx` → `apps/web/src/app/og/route.ts` 로 이동 (경로 변경: `/api/og` → `/og`)
2. `player-header.tsx` `handleDownloadImage()`: fetch URL `/api/og?` → `/og?`
3. `apps/web/src/app/players/[pubgId]/page.tsx` `generateMetadata`: OG 이미지 URL `/api/og?` → `/og?`
4. catch 블록에서 silent fail → `setRefreshError('이미지 저장에 실패했습니다.')` 3초 표시
5. `a.click()` → `document.body.appendChild(a); a.click(); document.body.removeChild(a)` (브라우저 호환성)

---

### Feature 1: DB 스키마 확장 — player_match_stats 3개 컬럼 추가

| 컬럼 | 타입 | PUBG API 필드 | 설명 |
|------|------|-------------|------|
| `dbnos` | INTEGER | `DBNOs` | 넉다운(knock down) 횟수 |
| `kill_streaks` | INTEGER | `killStreaks` | 최장 연속 킬 수 |
| `swim_distance` | NUMERIC(10,2) | `swimDistance` | 수영 이동 거리(m) |

- Drizzle 마이그레이션 파일 생성 (0005_extended_match_stats.sql)
- `_journal.json` 타임스탬프 엄격 오름차순 유지

---

### Feature 2: Worker — PUBG API 수집 로직 확장

**파일**: `apps/worker/src/processors/playerFetch.processor.ts` (또는 match-collection.worker.ts)

- 매치 참가자 stats 파싱 시 `DBNOs`, `killStreaks`, `swimDistance` 추가 추출
- DB insert 시 새 컬럼에 저장

---

### Feature 3: 분석 엔진 확장

#### 3-A. 기존 카테고리 지표 추가

**공격성(aggression)** 추가 지표:
| 지표 | 계산 | 개선 힌트 조건 |
|-----|------|-------------|
| `damage_per_kill` | avg(damageDealt / max(kills,1)) | < 100 → "마무리 능력 개선 필요" |
| `games_with_kills_rate` | count(kills≥1) / total | < 0.5 → "더 적극적인 교전 참여 필요" |
| `damage_per_minute` | avg(damageDealt / (timeSurvived/60)) | < 30 → "교전 빈도 증가 필요" |

**생존(survival)** 추가 지표:
| 지표 | 계산 | 개선 힌트 조건 |
|-----|------|-------------|
| `survival_ratio` | avg(timeSurvived / durationSec) | < 0.4 → "초반 교전 자제 필요" |
| `top10_to_win_rate` | wins / max(top10_count,1) | < 0.15 → "엔딩존 교전 능력 개선 필요" |
| `boost_ratio` | avg(boosts / max(boosts+heals,1)) | < 0.3 → "부스터 우선 사용 권장" |
| `total_items_per_game` | avg(heals+boosts) | < 2 → "아이템 루팅 적극성 필요" |

#### 3-B. 신규 카테고리: 일관성 (Consistency)

**목적**: 운빨이 아닌 안정된 실력인지 판별

| 지표 | 계산 | 설명 |
|-----|------|------|
| `kill_consistency` | 1 - (stdDev(kills) / max(avg(kills),0.01)), clamp(0,1) | 매 게임 킬 편차 |
| `damage_consistency` | 1 - (stdDev(damage) / max(avg(damage),0.01)), clamp(0,1) | 매 게임 데미지 편차 |

`consistencyScore` = kill_consistency × 50 + damage_consistency × 50

개선 힌트:
- kill_consistency < 0.4 → "킬 편차가 큼, 운보다 실력 일관성 향상 필요"
- damage_consistency < 0.4 → "데미지 편차가 큼, 매 게임 안정적 교전 필요"

#### 3-C. 신규 카테고리: 결정력 (Clutch)

**목적**: 중요한 순간(엔딩존, 1v1)에서의 퍼포먼스

| 지표 | 계산 | 개선 힌트 조건 |
|-----|------|-------------|
| `knock_finish_rate` | avg(kills / max(dbnos,1)) (dbnos>0인 게임만) | < 0.7 → "넉다운 후 빠른 마무리 필요" |
| `kill_streak_avg` | avg(kill_streaks) | — (정보성) |
| `top10_to_win_rate` | wins / max(top10_count,1) | < 0.15 → "엔딩 교전 결정력 필요" |

`clutchScore` = knock_finish_rate×50 + min(top10_to_win_rate×3, 1)×30 + min(kill_streak_avg/3, 1)×20

---

### Feature 4: DB schema — play_style_analyses 컬럼 추가

| 추가 컬럼 | 타입 | 내용 |
|---------|------|------|
| `consistency_score` | NUMERIC(5,2) | 일관성 점수 |
| `clutch_score` | NUMERIC(5,2) | 결정력 점수 |
| `consistency_metrics` | JSONB | kill_consistency, damage_consistency |
| `clutch_metrics` | JSONB | knock_finish_rate, kill_streak_avg, top10_to_win_rate |

- 마이그레이션: 0006_extended_analysis_scores.sql

---

### Feature 5: API 응답 확장

**파일**: `apps/api/src/routes/v1/players.ts`

`latestAnalysis` 응답에 추가:
```json
{
  "consistencyScore": 72.5,
  "clutchScore": 61.0,
  "consistencyMetrics": { "kill_consistency": 0.75, "damage_consistency": 0.70 },
  "clutchMetrics": { "knock_finish_rate": 0.82, "kill_streak_avg": 1.3, "top10_to_win_rate": 0.22 }
}
```

---

### Feature 6: Analysis 페이지 UI 확장

**파일**: `apps/web/src/app/players/[pubgId]/analysis/`

- 기존 4개 카드에 새 세부 지표 rows 추가
- "일관성" 카드 신규 추가 (consistencyScore)
- "결정력" 카드 신규 추가 (clutchScore)
- 각 지표 옆 개선 힌트 뱃지/텍스트 표시 (threshold 기반, 조건 미충족 시만 표시)
- 레이더 차트 축 추가 (6개: 공격성, 생존, 포지셔닝, 팀플, 일관성, 결정력)

---

### Feature 7: LLM 프롬프트 업데이트

**파일**: `apps/worker/src/lib/llm.ts`

- consistencyScore, clutchScore 및 핵심 신규 지표(damage_per_kill, knock_finish_rate, survival_ratio) 프롬프트에 포함
- "개선이 필요한 부분" 한 문장 포함하도록 프롬프트 유도

---

## 구현 순서

```
[Worker-A] DB migration 0005 (player_match_stats 컬럼 추가)
[Worker-B] PUBG API 수집 로직 확장 (dbnos, kill_streaks, swim_distance)
[Worker-C] 분석 엔진 확장 (기존 카테고리 + consistency + clutch)
    ↓ (Worker-A 완료 후)
[DB] migration 0006 (play_style_analyses 컬럼 추가)
[BE] API 응답 확장
[FE] Analysis UI 카드 추가
[FE-fix] PNG 다운로드 버그 수정
[Worker] LLM 프롬프트 업데이트
```

Worker-A/B/C → DB → BE → FE 순서 의존성 있음. FE fix는 독립 병렬 가능.

---

## 체크리스트

- [ ] DB migration 타임스탬프 오름차순 검증
- [ ] dbnos=0인 게임(교전 없음) 예외처리 (knock_finish_rate 계산 시 제외)
- [ ] consistencyScore: matches < 5개이면 신뢰도 낮음 → null or 표시 축소
- [ ] PUBG API `DBNOs` 필드 실제 존재 여부 Zod 스키마 확인
- [ ] 기존 플레이어 데이터는 dbnos=null → 재수집 전까지 knock_finish_rate 표시 안 함
- [ ] PNG 다운로드 fix 브라우저 호환성 (Chrome/Firefox/Safari/모바일)
