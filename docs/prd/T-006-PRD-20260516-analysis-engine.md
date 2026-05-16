# T-006 PRD — 플레이 스타일 분석 엔진

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

수집된 매치 데이터를 기반으로 플레이어의 4대 성향 점수와 세부 지표를 계산하는 분석 엔진을 구현한다.

## 4대 성향 정의

### 1. 공격성 (Aggression) — 0~100점
| 지표 | 가중치 | 계산법 |
|------|--------|--------|
| 킬/매치 | 35% | avg_kills / 정규화 |
| 데미지/매치 | 30% | avg_damage / 정규화 |
| 헤드샷 비율 | 20% | headshot_kills / kills |
| 교전 참여율 | 15% | (kills + assists) / total_players * factor |

### 2. 생존형 (Survival) — 0~100점
| 지표 | 가중치 | 계산법 |
|------|--------|--------|
| 평균 생존시간 | 40% | avg_survival_time / match_duration |
| 부스터 사용량 | 25% | avg_boosts / 정규화 |
| 힐 사용량 | 20% | avg_heals / 정규화 |
| 평균 순위 | 15% | 1 - (avg_placement / total_players) |

### 3. 포지셔닝 (Positioning) — 0~100점
| 지표 | 가중치 | 계산법 |
|------|--------|--------|
| 도보 이동거리 | 30% | avg_walk_distance / 정규화 |
| 차량 이동거리 | 20% | avg_vehicle_distance / 정규화 |
| 이동거리 총합 | 25% | (walk + vehicle) 종합 |
| 우승권 진입률 | 25% | top10_rate (순위 10위 이내 비율) |

### 4. 팀플레이 (Teamplay) — 0~100점
| 지표 | 가중치 | 계산법 |
|------|--------|--------|
| 부활 횟수 | 40% | avg_revives / 정규화 |
| 어시스트 | 35% | avg_assists / 정규화 |
| 아이템 지원 | 25% | 팀킬 페널티 적용 |

## 정규화 기준 (백분위 기반)

- 절대값 기준 대신 **샘플 기준 백분위** 사용은 초기엔 어려우므로
- 사전 정의된 **상한선 clamp** 방식 사용:
  ```
  avg_kills: max 8 → 8킬이면 100점
  avg_damage: max 600 → 600이면 100점
  headshot_rate: max 0.6 → 60%이면 100점
  avg_survival_time: max 1800s → 30분이면 100점
  ```
- 추후 누적 플레이어 데이터가 쌓이면 백분위 기반으로 전환 예정

## 세부 분석 지표 (jsonb 저장)

### aggression_metrics
```json
{
  "avg_kills": 3.2,
  "avg_damage": 285.4,
  "headshot_rate": 0.31,
  "avg_assists": 1.8,
  "kill_participation_rate": 0.42,
  "first_blood_rate": 0.25
}
```

### survival_metrics
```json
{
  "avg_survival_time_sec": 1240,
  "avg_placement": 8.3,
  "top10_rate": 0.45,
  "win_rate": 0.08,
  "avg_boosts": 3.1,
  "avg_heals": 4.2
}
```

### positioning_metrics
```json
{
  "avg_walk_distance": 2840,
  "avg_vehicle_distance": 1200,
  "vehicle_usage_rate": 0.65,
  "avg_weapons_acquired": 5.1,
  "preferred_map": "에란겔"
}
```

### teamplay_metrics
```json
{
  "avg_revives": 0.8,
  "avg_assists": 1.8,
  "avg_team_kills": 0.02,
  "support_score": 72.4
}
```

## 무기 선호도 분석

`raw_stats`의 무기 데이터에서:
```json
[
  { "weapon": "M416", "kills": 45, "damage": 8200, "headshot_rate": 0.32 },
  { "weapon": "AWM", "kills": 12, "damage": 2100, "headshot_rate": 0.67 }
]
```
- 킬 기여도 상위 5개 무기 저장
- 무기 카테고리 분류: AR / SR / SMG / DMR / Shotgun / Pistol / Melee

## 구현

```
apps/worker/src/
  processors/
    analysis.processor.ts  # BullMQ 프로세서
  lib/
    analysis/
      engine.ts           # 메인 분석 엔진 (pure function)
      metrics/
        aggression.ts
        survival.ts
        positioning.ts
        teamplay.ts
        weapons.ts
      normalizer.ts       # 점수 정규화 함수
      types.ts
```

## 완료 조건

- [ ] 4대 성향 점수 계산 함수 구현 (pure function)
- [ ] 각 성향별 단위 테스트 (mock 매치 데이터 → 예상 점수 검증)
- [ ] `play_style_analyses` 테이블에 분석 결과 저장
- [ ] 분석 소요 시간 < 2초 (20매치 기준)
- [ ] 무기 선호도 Top 5 추출 동작
- [ ] 분석 결과 `analysis_jobs` 상태 업데이트 (completed/failed)

## 의존성

- T-002 (DB 스키마)
- T-004 (PUBG API 클라이언트 — Zod 타입 공유)
- T-005 (매치 수집 워커 — 분석 잡 트리거)
