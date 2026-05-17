# T-028 PRD — 킬/데스 히트맵 (맵별 시각화)

**작성일**: 2026-05-17
**상태**: 대기 (승인 전)
**유형**: feat

---

## 배경

플레이어가 "내가 어디서 자주 죽고 어디서 잘 따는지"를 한눈에 보면, 진입 루트나 회피 지역 결정이 즉시 바뀐다. PUBG 텔레메트리의 `LogPlayerKillV2` 이벤트에는 killer/victim 양쪽의 좌표가 들어있어, 본인이 관여한 모든 킬/데스를 맵 좌표 위에 점으로 찍을 수 있다.

부가 효과: 시각적 임팩트가 커서 SNS 공유에 적합 — 사용자 유입 트래픽에 도움.

---

## 데이터 소스

`match_telemetry.payload`의 `LogPlayerKillV2` 이벤트:

```typescript
interface LogPlayerKillV2 {
  _T: 'LogPlayerKillV2';
  _D: string;
  killer?: { accountId: string; location: { x: number; y: number; z: number }; ... };
  victim: { accountId: string; location: { x: number; y: number; z: number }; ... };
  finisher?: { ... };           // 다운된 적을 마무리한 사람 (스쿼드)
  dBNOId?: number;              // DBNO(다운) 여부
  killerDamageInfo?: { damageReason: string; damageTypeCategory: string; distance: number; };
}
```

본인 기준 추출:
- **킬 위치**: `killer.accountId === me`인 이벤트의 `victim.location` (적이 죽은 지점)
- **데스 위치**: `victim.accountId === me`인 이벤트의 `victim.location` (본인이 죽은 지점)
- 어시스트(finisher만 본인): 표시 안 함 (혼란)

좌표는 PUBG 맵 좌표계(에란겔 기준 X/Y 0~800000 cm). 정규화 필요.

---

## 맵 좌표 정규화

각 맵의 실제 크기는 다르다:

| 맵 | API mapName | 크기 | 좌표 범위 (cm) |
|---|---|---|---|
| 에란겔 | Erangel_Main | 8×8 km | 0~813000 |
| 미라마 | Desert_Main | 8×8 km | 0~813000 |
| 사녹 | Savage_Main | 4×4 km | 0~408000 |
| 비켄디 | DihorOtok_Main | 6×6 km | 0~610000 |
| 카라킨 | Summerland_Main | 2×2 km | 0~204000 |
| 파라모 | Chimera_Main | 3×3 km | 0~306000 |
| 태이고 | Tiger_Main | 8×8 km | 0~813000 |
| 데스턴 | Heaven_Main | 8×8 km | 0~813000 |
| 론도 | Kiki_Main | 8×8 km | 0~813000 |

```typescript
// apps/web/src/lib/maps.ts
const MAP_SIZES = {
  'Erangel_Main': 813000,
  'Desert_Main': 813000,
  'Savage_Main': 408000,
  // ...
}

function normalizeToUnitSquare(loc: {x: number, y: number}, mapName: string) {
  const size = MAP_SIZES[mapName] ?? 813000
  return { x: loc.x / size, y: loc.y / size }  // 0~1 범위
}
```

---

## 변경 범위

### 1. `apps/worker` — 좌표 집계

#### `lib/analysis/heatmap/aggregator.ts` (신규)

분석 시점에 텔레메트리에서 본인 관여 킬/데스 좌표만 뽑아 jsonb로 저장. 매 페이지 로드마다 텔레메트리 재파싱하는 비용 방지.

```typescript
interface MapHeatmapPoints {
  mapName: string;
  kills: Array<[number, number]>;   // 정규화된 0~1 좌표
  deaths: Array<[number, number]>;
}

async function aggregateHeatmaps(
  playerId: string,
  matches: Array<{ matchId: string; mapName: string; pubgAccountId: string }>
): Promise<Record<mapName, MapHeatmapPoints>>
```

소수점 4자리로 반올림 (1 / 0.0001 = 800m × 800m 정도 정밀도면 시각화에 충분).

#### `analysis.processor.ts` 수정
약점 룰 평가(T-027) 다음에 히트맵 집계 추가. 결과는 `play_style_analyses.heatmap_data jsonb`에 저장.

```sql
-- migration 0007_heatmap.sql
ALTER TABLE play_style_analyses
  ADD COLUMN heatmap_data jsonb;  -- Record<mapName, MapHeatmapPoints>
```

텔레메트리 없는 매치는 좌표 없음 → 가용한 것만 집계.

### 2. `apps/api`

기존 `GET /api/v1/players/:id/analysis` 응답에 `heatmaps` 필드 추가 (별도 엔드포인트 만들지 않음 — 데이터 작음, 매치 100개 기준 한 맵당 100~500 좌표).

### 3. `apps/web` — 히트맵 컴포넌트

#### `apps/web/src/components/heatmap/MapHeatmap.tsx` (신규)

라이브러리 선택 안:
- **A. SVG 직접 (채택)** — 좌표 수가 적고 (한 맵당 수백 개), 추가 의존성 없음, shadcn/ui와 톤 맞추기 쉬움.
- B. heatmap.js — 진짜 그라데이션 heatmap이지만 SSR 까다롭고 모바일 성능 우려.
- C. deck.gl — 오버킬.

SVG 구현:
```tsx
<svg viewBox="0 0 1000 1000">
  <image href={`/maps/${mapName}.jpg`} width="1000" height="1000" />
  {kills.map(([x, y]) => (
    <circle cx={x * 1000} cy={y * 1000} r="4" fill="var(--color-success)" opacity="0.6" />
  ))}
  {deaths.map(([x, y]) => (
    <circle cx={x * 1000} cy={y * 1000} r="4" fill="var(--color-danger)" opacity="0.6" />
  ))}
</svg>
```

점이 많을 때 겹치는 부분은 자연스럽게 진해짐 (opacity 누적) → 단순 점 plot으로도 "히트맵스러운" 효과 가능.

#### 맵 배경 이미지

`apps/web/public/maps/{mapName}.jpg` (각 맵 미니맵, 약 1024×1024 jpg). PUBG 공식 미니맵을 직접 가져다 쓰면 라이선스 모호 — **상위/도식화된 단순 윤곽 SVG** 를 자체 제작하거나, 공식 게임 자산이 아닌 커뮤니티의 free-use 미니맵 활용. (구현 시 결정)

대안: 배경 없이 좌표 분포만 표시하고 사용자가 식별 가능한 주요 도시명만 텍스트 오버레이.

#### UI 통합

`/players/[id]` 페이지에 새 탭 "히트맵" 추가:

```
┌─ 맵 선택 ──────────────────────────────────────┐
│  [에란겔 12판] [미라마 5판] [사녹 3판]            │
└─────────────────────────────────────────────┘

┌─ 에란겔 ─────────────────────────────────────┐
│                                              │
│     [미니맵 이미지 + 킬(녹)/데스(빨) 점들]      │
│                                              │
│  킬 23개  데스 12회                            │
│  ☑ 킬 표시  ☑ 데스 표시                        │
└─────────────────────────────────────────────┘

┌─ 자주 죽는 지역 Top 3 ───────────────────────┐
│  1. Pochinki 인근 — 5회 사망                  │
│  2. Georgopol 항구 — 3회                      │
│  3. School — 2회                              │
└─────────────────────────────────────────────┘
```

"자주 죽는 지역"은 좌표를 격자(예: 32×32)로 묶어 빈도 카운트 → Top 3에 가장 가까운 알려진 지명 매핑. 지명 좌표는 `apps/web/src/lib/maps.ts`에 하드코딩.

---

## 동작 안 함 케이스

- 텔레메트리 가용 매치 5개 미만: 히트맵 탭 자체를 비활성화하고 "분석에 필요한 데이터가 더 필요합니다" 메시지
- 모르는 mapName: 정규화 size를 813000으로 fallback, 배경은 회색 격자

---

## 공유 (선택 기능 — 본 PRD 내 포함)

히트맵 카드에 "이미지로 저장" 버튼. SVG → Canvas → PNG. T-019(공유 기능)의 OG 이미지 생성기와 동일한 헬퍼 재사용 가능.

---

## 완료 조건

- [ ] `aggregateHeatmaps()` 함수 + 단위 테스트 (mock 텔레메트리)
- [ ] `play_style_analyses.heatmap_data` 마이그레이션
- [ ] `analysis.processor`에서 집계 후 저장
- [ ] API 응답에 `heatmaps` 포함
- [ ] `MapHeatmap` SVG 컴포넌트 + 좌표 정규화 유틸
- [ ] 맵 배경 이미지 9종 (혹은 윤곽 SVG)
- [ ] 맵별 탭 UI + 킬/데스 토글
- [ ] "자주 죽는 지역 Top 3" 계산 + 지명 매핑
- [ ] 매치 5개 미만일 때 비활성화 처리
- [ ] PNG 저장 버튼

## 의존성

- T-026 (텔레메트리 파이프라인 — 좌표 데이터)
- T-009 (플레이어 프로필 페이지 — 탭 통합)
- T-010 (분석 대시보드 — 분석 시점에 집계)

## 비완료 (후속 PRD 범위)

- 진짜 그라데이션 heatmap (커널 밀도 추정) — 점 plot으로 충분하면 생략
- 시간대별 히트맵 (페이즈 1 vs 페이즈 4) — 별도 PRD
