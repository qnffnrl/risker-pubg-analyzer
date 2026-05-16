# T-022 PRD — 맵 이름 매핑 보완 + 생존전 모드 필터

**작성일**: 2026-05-17  
**상태**: 승인됨  
**유형**: fix

---

## 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/app/players/[pubgId]/map-view.tsx` | 누락된 맵 ID 추가 (DihorOtok_Main → 비켄디, Summerland_Main → 서머랜드) |
| `apps/api/src/routes/v1/players.ts` | `/maps` 엔드포인트 — 생존전 모드만 집계 (squad, duo, solo 계열) |

## 상세

### 1. MAP_NAMES 보완
- `DihorOtok_Main` → 비켄디 (구버전 맵 ID, 현재 매핑 없어 원시 이름 표시됨)
- `Summerland_Main` → 서머랜드
- 색상 매핑(MAP_COLORS, MAP_TEXT_COLORS)도 동일하게 추가

### 2. 생존전 모드 필터
`/maps` SQL 쿼리에 `.where()` 조건 추가:
```
mode IN ('squad','squad-fpp','duo','duo-fpp','solo','solo-fpp',
         'normal-squad','normal-squad-fpp','normal-duo','normal-duo-fpp','normal-solo','normal-solo-fpp')
```
