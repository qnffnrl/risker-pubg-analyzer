# T-027 PRD — 약점 진단 룰 엔진 + AI 코칭 메시지

**작성일**: 2026-05-17
**상태**: 대기 (승인 전)
**유형**: feat

---

## 배경

현재 분석 대시보드는 4대 성향 점수 + LLM 자연어 요약을 제공한다. 점수는 "나는 어떤 스타일인가"는 알려주지만 "내일 무엇을 다르게 해야 하는가"는 답하지 못한다. LLM 요약(`apps/worker/src/lib/llm.ts`)도 현재는 점수 나열형 프롬프트라 일반적인 평이 나온다.

실력 향상의 핵심은 **약점 1개 콕 집기**다. 사용자가 매번 받는 메시지가 "공격성 72점입니다"가 아니라 "최근 20판 중 14판에서 첫 교전 후 3분 내 사망했습니다 — 교전 후 리포지셔닝을 점검해보세요"가 되어야 한다.

본 PRD는 결정론적 룰 엔진으로 약점을 1~3개 감지하고, 그중 가장 강하게 발동한 것을 LLM에 넘겨 자연어 코칭으로 풀어내는 파이프라인을 정의한다.

---

## 핵심 원칙

1. **룰은 결정론적**: 점수 4개와 별개로, 임계값 기반 boolean 결과 + 강도(0~1).
2. **부분 가용성**: 텔레메트리 없는 사용자에게도 동작해야 함. 룰을 2-tier로 나눔.
3. **단일 메시지**: 사용자에게 노출하는 약점은 **최대 1개**. 여러 개 감지돼도 강도 최상위만 보여줌. (정보 과부하 방지)
4. **LLM은 룰 출력의 자연어화만 담당**: LLM이 약점을 *판단*하지 않는다 — 룰이 판단하고 LLM은 표현만.

---

## 룰 정의

### Tier 1: 매치 집계 스탯만으로 가능 (텔레메트리 불필요)

`playerMatchStats` 기존 컬럼만 사용. 텔레메트리 없는 매치/사용자에게도 동작.

| ID | 약점명 | 조건 | 강도 |
|---|---|---|---|
| R001 | 최근 폼 하락 | 최근 5게임 평균 데미지가 이전 15게임 평균의 70% 이하 | `1 - recent/prev` |
| R002 | 회복템 미사용 | 부스터+힐 합계가 매치당 평균 3 이하 AND 평균 생존시간 15분 초과 | 강도 = (3 - avg) / 3 |
| R003 | 단발 매치 의존 | kills 표준편차 / kills 평균 > 1.5 (편차가 크다 = 잘되는 날만 잘됨) | (CoV - 1.5) / 1.5 |
| R004 | 자기장 늦진입 | 평균 생존시간 < 10분 AND 순위 평균 > 50위 | (10*60 - avg_survival) / (10*60) |
| R005 | 어시스트 부재 (스쿼드) | 모드가 squad/duo AND 평균 어시스트 < 0.5 AND 평균 킬 > 2 | (0.5 - avg_assists) / 0.5 |
| R006 | 차량 의존 / 도보 부족 | 평균 도보 < 1500m AND 평균 순위 > 30 | (1500 - avg_walk) / 1500 |
| R007 | 무기 다양성 부족 | 매치당 평균 무기 획득 < 3 (= 한두 자루로 끝까지 감) | (3 - avg_weapons) / 3 |

### Tier 2: 텔레메트리 필요 (T-026 의존)

`match_telemetry`에서 이벤트 집계.

| ID | 약점명 | 조건 (텔레메트리 이벤트 기반) | 강도 |
|---|---|---|---|
| R101 | 첫 교전 후 즉사 | `LogPlayerKillV2`로 본인이 첫 킬/킬당함 후 180초 내 사망한 매치 비율 > 40% | (rate - 0.4) / 0.6 |
| R102 | 후방 피격 다발 | `LogPlayerTakeDamage`에서 attacker가 본인 시야 뒤쪽(좌표 기반 추정)에 있던 데미지가 받은 총 데미지의 50% 초과 | (rate - 0.5) / 0.5 |
| R103 | 첫 다운자 빈도 (스쿼드) | 본인 팀에서 첫 다운된 사람이 본인인 매치 비율 > 40% | (rate - 0.4) / 0.6 |
| R104 | 자기장 외곽 점유 | `LogGameStatePeriodic`과 본인 위치 기준, 페이즈 3 이후 자기장 중심까지 거리가 자기장 반지름의 70% 초과인 시간 비율 > 60% | (rate - 0.6) / 0.4 |
| R105 | 헤드샷 부재 | 본인이 가한 데미지 중 headshot 비율 < 8% AND avg_kills > 1 | (0.08 - rate) / 0.08 |
| R106 | 근접 교전 의존 | 본인 킬의 평균 거리 < 30m | (30 - avg_dist) / 30 |
| R107 | 자기장 늦진입 (정밀) | 페이즈 N 시작 시점에 본인이 자기장 외부에 있던 비율 > 30% | (rate - 0.3) / 0.7 |

룰 추가는 코드 한 곳(`apps/worker/src/lib/analysis/weaknesses/rules/`)에 파일 추가로만 끝나도록 설계 (open/closed).

---

## 데이터 구조

### Rule 인터페이스

```typescript
// apps/worker/src/lib/analysis/weaknesses/types.ts
interface WeaknessRule {
  id: string;                    // 'R001' 등
  name: string;                  // 한글 약점명
  tier: 1 | 2;                   // 텔레메트리 필요 여부
  category: 'aggression' | 'survival' | 'positioning' | 'teamplay';
  evaluate(ctx: RuleContext): WeaknessFinding | null;
}

interface RuleContext {
  matches: MatchRow[];           // 기존 집계 스탯
  telemetry?: TelemetryBundle;   // tier 2일 때만, 없으면 룰 skip
  modeFilter?: string;           // squad/duo/solo
}

interface WeaknessFinding {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: number;              // 0~1
  evidence: {
    metric: string;              // '최근 5게임 평균 데미지'
    value: number | string;      // 측정값
    threshold: number | string;  // 임계값
    matchesAffected?: number;    // 해당된 매치 수
  };
}
```

### 분석 결과 확장

`play_style_analyses` 테이블에 컬럼 2개 추가:
```sql
-- migration 0006_weaknesses.sql
ALTER TABLE play_style_analyses
  ADD COLUMN top_weakness jsonb,        -- WeaknessFinding 단일 객체 (UI 노출용)
  ADD COLUMN all_weaknesses jsonb;      -- WeaknessFinding[] (감지된 모든 약점, 디버깅/관리자용)
```

기존 `llmSummary` 컬럼은 유지하되 의미를 바꾼다: 점수 요약 → **약점 코칭 메시지**.

---

## 룰 엔진 동작 흐름

```
analysisProcessor
  ├─ 1. matches 로드 (기존)
  ├─ 2. 텔레메트리 로드 (T-026의 loader 사용, 없으면 빈 번들)
  ├─ 3. analyzePlayStyle() → 4축 점수 (기존)
  ├─ 4. evaluateWeaknesses(ctx)
  │     ├─ Tier 1 룰 전부 평가
  │     ├─ Tier 2 룰: 텔레메트리 가용한 매치만 사용 (10판 이상이면 평가, 아니면 skip)
  │     └─ severity desc 정렬 → all_weaknesses
  ├─ 5. topWeakness = all_weaknesses[0]  (없으면 null)
  ├─ 6. generateCoachingMessage(topWeakness, ctx)  → LLM
  └─ 7. DB 저장
```

---

## LLM 프롬프트 교체

`apps/worker/src/lib/llm.ts`의 `buildPrompt()`를 약점 기반으로 교체.

```typescript
function buildCoachingPrompt(weakness: WeaknessFinding, nickname: string, matchCount: number): string {
  return `다음은 PUBG 플레이어 "${nickname}"의 최근 ${matchCount}매치에서 감지된 약점입니다.

약점: ${weakness.ruleName}
카테고리: ${weakness.category}
근거: ${weakness.evidence.metric} = ${weakness.evidence.value} (임계값 ${weakness.evidence.threshold})

이 약점에 대해 다음을 만족하는 코칭 메시지를 한국어로 작성하세요:
1. 첫 문장: 무엇이 문제인지 (수치 한 개 인용)
2. 두 번째 문장: 왜 이게 실력 향상을 막는지 (게임 메커니즘 관점)
3. 세 번째 문장: 다음 게임에서 시도할 구체적 행동 1개 (추상적인 조언 금지)

3문장, 마크다운 없이, 따뜻하지만 직설적인 톤으로. 격려/위로 표현 금지.`
}
```

약점이 하나도 감지되지 않은 경우(거의 없겠지만 모든 임계값 미달): 기존 점수 기반 프롬프트로 fallback.

---

## UI 변경

### `/players/[id]` 분석 대시보드 (T-010 화면)

기존 레이더 차트 + LLM 요약 영역 위에 **약점 카드** 추가:

```
┌─ 이번 분석에서 가장 큰 누수 ──────────────────┐
│  [긴급] 교전 후 리포지셔닝                       │
│                                                  │
│  최근 20판 중 14판에서 첫 교전 후 3분 이내       │
│  사망했습니다. 교전 후 위치 노출이 정리되지       │
│  않으면 후속 적에게 노출됩니다. 다음 게임에서는   │
│  킬 직후 5초 안에 엄폐물 뒤로 이동해보세요.       │
│                                                  │
│  [근거] 첫 교전 후 3분 내 사망률 70% (임계 40%)  │
└──────────────────────────────────────────────┘
```

- 약점이 없으면 카드 숨김 (안 보여주는 게 거짓 안심보다 낫다)
- "근거" 영역은 접힘/펼침 토글
- severity에 따라 카드 좌측 색 띠 (0.7+ 빨강, 0.4~0.7 주황, 0.4 미만 노랑)

### 4축 점수 영역
변경 없음. 약점 카드는 점수와 *별개*의 정보로 위치한다.

---

## 동작 안 함 케이스 / 엣지

- 매치 5개 미만: 약점 카드 자체를 노출하지 않음 (표본 부족 안내)
- Tier 2 룰: 텔레메트리 가용 매치 10개 미만이면 해당 룰들 skip (Tier 1만으로 평가)
- 모드 혼재: R005(어시스트 부재)처럼 모드 의존 룰은 squad/duo 매치 비율 70% 이상일 때만 평가
- 룰 결과 캐싱: 기존 분석 캐시(24h TTL)에 함께 저장. forceRefresh 시 재평가.

---

## 완료 조건

- [ ] `apps/worker/src/lib/analysis/weaknesses/` 디렉토리 + `types.ts`, `engine.ts`
- [ ] Tier 1 룰 7개(R001~R007) 구현 + 각 룰 단위 테스트 (mock matches → 발동/미발동 확인)
- [ ] Tier 2 룰 7개(R101~R107) 구현 + 단위 테스트 (텔레메트리 mock)
- [ ] `evaluateWeaknesses()` 메인 진입점 — 모든 룰 평가 후 severity 정렬
- [ ] `play_style_analyses` 마이그레이션 (`top_weakness`, `all_weaknesses` 컬럼)
- [ ] `analysis.processor.ts`에서 룰 엔진 호출 + 결과 저장
- [ ] `llm.ts`에 `buildCoachingPrompt()` + fallback 로직
- [ ] API `GET /api/v1/players/:id/analysis` 응답에 `topWeakness` 포함
- [ ] 약점 카드 UI 컴포넌트 (`apps/web/src/components/analysis/WeaknessCard.tsx`)
- [ ] 대시보드 페이지에 약점 카드 통합
- [ ] 약점 없음 / 표본 부족 / 모드 혼재 케이스 처리

## 의존성

- T-006 (분석 엔진)
- T-010 (분석 대시보드 — UI 통합)
- T-011 (LLM 요약 — 프롬프트 교체)
- T-026 (텔레메트리 파이프라인 — Tier 2 룰)

## 비완료 (후속 PRD 범위)

- 약점 시계열 추적 ("지난주 약점 → 이번주 개선됐는지") → T-030 (자가 비교)
- 사용자별 약점 우선순위 커스터마이징
