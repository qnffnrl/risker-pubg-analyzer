# T-029 PRD — 4축 성향 점수 리팩토링 (실력 의존도 분리)

**작성일**: 2026-05-17
**상태**: 대기 (승인 전)
**유형**: refactor

---

## 배경

현재 4축 점수(`apps/worker/src/lib/analysis/metrics/`)는 **성향이 아니라 실력**을 측정한다.

| 축 | 현재 구성 요소 | 문제 |
|---|---|---|
| 공격성 | avg_kills 35%, avg_damage 30%, headshot 20%, KP 15% | 잘하는 사람 = 다 높음 |
| 생존형 | survivalTime 40%, boosts 25%, heals 20%, placement 15% | 잘하는 사람 = 다 높음 |
| 포지셔닝 | walk 30%, vehicle 20%, total 25%, **top10rate 25%** | 잘하는 사람 = 다 높음. 게다가 top10rate는 survival에도 들어가 중복 가중됨 |
| 팀플레이 | revives 40%, assists 35%, teamKills penalty 25% | revives/assists는 강한 팀원 효과 (캐리당하면 낮아짐) |

결과적으로 모든 축이 K/D와 상관관계가 높아, 잘하는 두 플레이어가 **다른 성향**임에도 레이더 차트가 비슷한 모양으로 나온다. 사용자가 "내 스타일"이라 느낄 차별화가 부족하다.

본 PRD는 4축을 **분포/타이밍/비율** 기반의 진짜 성향 신호로 갈아끼운다. 점수 자체가 K/D와 무관해지도록 설계한다 — K/D는 별도 "실력 점수"로 분리.

---

## 신구 비교

### Before (현재)

```
공격성: 평균 킬, 평균 데미지 → 절대값이 높으면 점수 ↑
```

### After

```
공격성: 첫 교전 시각 (이른가), 킬 거리 중앙값 (가까운가), 자기장 진입 타이밍 (선제적인가)
       → "어떻게" 싸우는지를 측정, 잘하든 못하든 스타일 자체는 변하지 않음
```

같은 K/D 2.0인 두 사람:
- A: "초반 핫드롭, 가까운 거리에서 빠르게 정리" → 공격성 85, 생존형 25
- B: "외곽 안전 운영, 후반에 자기장 끼고 마무리" → 공격성 30, 생존형 80

지금 시스템에서는 둘 다 공격성 70대, 생존형 70대로 나온다.

---

## 새 4축 정의

### 1. 공격성 (Aggression) — "얼마나 빨리/가깝게 싸우려 하는가"

| 신규 지표 | 가중치 | 데이터 소스 |
|---|---|---|
| 첫 교전 백분위 | 30% | `LogPlayerKillV2` / `LogPlayerTakeDamage` 중 본인 첫 등장 시각 / 매치 평균과 비교 |
| 킬 거리 중앙값 (역수) | 25% | `LogPlayerKillV2.killerDamageInfo.distance` 중앙값 — 가까울수록 점수↑ |
| 자기장 선제 진입 비율 | 20% | 각 페이즈 시작 시 본인이 다음 자기장 내부에 있던 비율 |
| 매치당 데미지/시간 비율 | 25% | `damageDealt / timeSurvived` — 단위 시간당 공격 강도 |

### 2. 생존형 (Survival) — "얼마나 위험을 회피하는가"

| 신규 지표 | 가중치 | 데이터 소스 |
|---|---|---|
| 1차 교전 회피 비율 | 30% | 본인 첫 교전이 매치 후반 50% 시점 이후인 매치 비율 |
| 자기장 외곽 시간 비율 (역수) | 25% | `LogPlayerPosition` × `LogGameStatePeriodic`로 자기장 가장자리 시간 측정 — 적을수록 점수↑ |
| 회복템 선제 사용률 | 25% | `LogItemUse` 중 본인 HP 70% 이상에서 부스터 사용한 비율 (위급 후 회복이 아닌 선제 관리) |
| 매치 평균 isolation index | 20% | 본인 좌표 주변 200m 내 평균 적 수 (적음 = 회피) |

### 3. 포지셔닝 (Positioning) — "어디를 점유하는가"

| 신규 지표 | 가중치 | 데이터 소스 |
|---|---|---|
| 자기장 중심 거리 평균 (역수) | 30% | 페이즈별 자기장 중심까지 거리 / 자기장 반지름. 중심에 가까울수록↑ |
| 고지대 점유 비율 | 25% | `LogPlayerPosition.location.z` 백분위 (해당 매치 전체 플레이어 대비 상위 z) |
| 자기장 진입 타이밍 분산 (역수) | 20% | 페이즈별 진입 시각의 분산. 적을수록 = 일관된 운영 |
| 차량 사용률 | 25% | (기존 유지) `distanceInVehicle > 100`인 매치 비율 |

### 4. 팀플레이 (Teamplay) — "팀과 어떻게 움직이는가"

| 신규 지표 | 가중치 | 데이터 소스 |
|---|---|---|
| 팀원과의 평균 거리 (역수) | 35% | `LogPlayerPosition` 매 10초마다 같은 팀원과의 평균 거리. 가까울수록↑ |
| 다운된 팀원까지 도달 시간 중앙값 (역수) | 25% | `LogPlayerMakeGroggy` 시각과 본인이 그 위치 20m 내 진입한 시각의 차이 |
| 첫 다운자 본인 비율 (역수) | 20% | 본인 팀에서 첫 다운된 사람이 본인이 *아닌* 비율 |
| 어시스트 비율 | 20% | (기존 유지) avg_assists |

---

## 실력 점수 분리

기존 점수에 녹아있던 "잘하는가" 신호는 별도 점수로 분리:

```sql
ALTER TABLE play_style_analyses
  ADD COLUMN skill_score numeric(5,2);  -- 0~100
```

```typescript
// apps/worker/src/lib/analysis/metrics/skill.ts (신규)
function calcSkill(matches: MatchRow[]): number {
  const kd = avg_kills / max(1, deaths_per_match);
  const dmg = avg_damage;
  const place = (avg_players - avg_placement) / avg_players;
  return weightedScore([
    [clampScore(kd, 3), 0.4],
    [clampScore(dmg, 500), 0.3],
    [place * 100, 0.3],
  ]);
}
```

이건 UI에서 4축 레이더와 별개로 "실력 점수"로 노출. 사용자가 두 정보를 분리해서 본다:
- **레이더 (4축)**: 내 스타일이 무엇인가
- **실력 점수 (단일)**: 그 스타일을 얼마나 잘 수행하는가

---

## 마이그레이션 전략 — 점진 전환

기존 4축 점수와 새 4축 점수가 **다른 신호**라서 직접 교체하면 사용자 입장에서 점수가 갑자기 변한다. 다음 순서:

### Phase 1: 병행 운영 (본 PRD)
- 새 컬럼 추가: `aggression_score_v2`, `survival_score_v2`, `positioning_score_v2`, `teamplay_score_v2`, `*_metrics_v2`, `skill_score`
- 기존 컬럼 유지 (`aggression_score` 등)
- 분석 시 둘 다 계산 후 둘 다 저장
- UI에는 새 점수로 노출, 기존은 "Legacy" 토글로 비교 가능

### Phase 2: 안정화 후 교체 (별도 운영 작업)
- v2 점수가 안정되면 (2~4주 운영) 기존 컬럼을 v2 값으로 덮어쓰고 v2 컬럼 drop
- 코드에서 v2 접미사 제거
- 본 PRD는 Phase 1까지만 수행

---

## 텔레메트리 의존도

| 축 | Tier 1 (집계만) 비중 | Tier 2 (텔레메트리) 비중 |
|---|---|---|
| 공격성 | 25% (damage/time) | 75% |
| 생존형 | 0% | 100% |
| 포지셔닝 | 25% (vehicle usage) | 75% |
| 팀플레이 | 20% (assists) | 80% |

텔레메트리 없으면 새 점수의 의미가 크게 감소. 텔레메트리 없는 경우 처리:
- 매치 절반 이상에 텔레메트리 있으면 → 가용 매치만으로 계산
- 절반 미만 → 새 점수 계산 skip, 기존 v1 점수만 노출
- 분석 결과에 `score_version: 'v1' | 'v2'` 메타필드 추가

---

## 변경 범위

### 1. `packages/db`
```sql
-- migration 0008_score_v2.sql
ALTER TABLE play_style_analyses
  ADD COLUMN score_version varchar(8) DEFAULT 'v1',
  ADD COLUMN aggression_score_v2 numeric(5,2),
  ADD COLUMN survival_score_v2 numeric(5,2),
  ADD COLUMN positioning_score_v2 numeric(5,2),
  ADD COLUMN teamplay_score_v2 numeric(5,2),
  ADD COLUMN aggression_metrics_v2 jsonb,
  ADD COLUMN survival_metrics_v2 jsonb,
  ADD COLUMN positioning_metrics_v2 jsonb,
  ADD COLUMN teamplay_metrics_v2 jsonb,
  ADD COLUMN skill_score numeric(5,2);
```

### 2. `apps/worker/src/lib/analysis/metrics/`
- `aggression.v2.ts`, `survival.v2.ts`, `positioning.v2.ts`, `teamplay.v2.ts` 신규
- `skill.ts` 신규
- `engine.ts`에서 텔레메트리 가용성 따라 v1/v2 분기 후 계산 결과 둘 다 반환
- 기존 v1 파일은 그대로 유지 (삭제 금지 — Phase 2까지 보존)

### 3. `apps/api`
- 응답 스키마에 v2 필드 + `scoreVersion` 추가
- 비교 API(T-013)도 동일하게 확장

### 4. `apps/web`
- 분석 대시보드 레이더 차트: 기본은 v2 사용, "이전 분석 방식 보기" 토글 시 v1
- 실력 점수: 4축 레이더 옆에 별도 카드로 단일 큰 숫자
- 비교 페이지(T-013): v2끼리만 비교, v1 사용자는 "비교 불가" 표시
- 변경 알림 배너: 첫 방문 시 "분석 방식이 업데이트되었습니다 — [무엇이 달라졌나]" 링크 (FAQ 페이지로)

### 5. 문서
- `docs/scoring-v2.md` 신규 — 새 지표 정의와 v1 → v2 매핑표. 사용자가 "왜 점수가 변했나" 물을 때 참조.

---

## 위험 / 완화책

| 위험 | 완화책 |
|---|---|
| 새 점수가 v1보다 의미 없게 느껴짐 | 5명 내부 테스트 → 결과 차이가 실제 플레이 스타일을 더 잘 반영하는지 확인 |
| 사용자 혼란 | 토글로 v1 결과 같이 노출 |
| 텔레메트리 가용성 낮은 사용자 점수 누락 | scoreVersion 표시 + v1 fallback |
| 마이그레이션 오류 | Phase 1에서 v1/v2 병행이라 롤백은 v2 컬럼 무시로 즉시 가능 |

---

## 완료 조건

- [ ] migration 0008 적용
- [ ] v2 메트릭 4종 + skill 점수 함수 구현 (`*.v2.ts`, `skill.ts`)
- [ ] 각 v2 메트릭 단위 테스트 (mock matches + mock telemetry)
- [ ] 텔레메트리 가용성 분기 로직 (`engine.ts`)
- [ ] `analysis.processor`에서 v1/v2 둘 다 저장
- [ ] API 응답에 v2 + `scoreVersion` 포함
- [ ] 대시보드 v2 레이더 + "이전 방식 보기" 토글
- [ ] 실력 점수 카드 신규
- [ ] 비교 페이지 v2 대응
- [ ] FAQ 페이지 (`docs/scoring-v2.md` 또는 web 내 정적 페이지)

## 의존성

- T-026 (텔레메트리 파이프라인)
- T-006 (기존 분석 엔진 — 병행 운영)
- T-010 (분석 대시보드)
- T-013 (비교 페이지)

## 비완료 (후속 운영)

- Phase 2 — v1 컬럼 drop, 코드 정리
- 백분위 기반 정규화 (현재는 clamp 기반 유지, 사용자 수 충분히 모이면 별도 검토)
