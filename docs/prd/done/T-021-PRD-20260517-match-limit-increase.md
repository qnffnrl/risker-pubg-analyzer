# T-021 PRD — 매치 수집 한도 증가 & Skip-if-exists 최적화

**작성일**: 2026-05-17  
**상태**: 대기 (승인 전)  
**유형**: feat + optimization

---

## 배경

현재 플레이어 검색 시 최근 20게임만 수집됨. 플레이 스타일 분석, 맵별 통계, 무기 분석 등 모든 기능이 이 20게임 기준으로 작동하므로 데이터 품질이 낮음.

## 목표

1. **matchLimit 100으로 증가** — `playerFetch.processor.ts`의 `matchLimit: 20` → `100`
2. **Skip-if-exists 최적화** — `matchCollection.processor.ts`에서 PUBG API 호출 전에 DB에 이미 존재하는 매치는 건너뜀 (중복 API 호출 방지)

## 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `apps/worker/src/processors/playerFetch.processor.ts` | `matchLimit: 20` → `matchLimit: 100` |
| `apps/worker/src/processors/matchCollection.processor.ts` | 루프 내 `pubg.getMatch()` 전에 `playerMatchStats` 존재 여부 확인, 존재하면 API 호출 스킵 |

## 기대 효과

- 최대 100게임 기반 분석 → 더 정확한 플레이 스타일 진단
- 이미 수집된 매치 재호출 제거 → PUBG API Rate Limit 절약, 처리 시간 단축
- `forceRefresh` 시에도 skip-if-exists 유지 (매치 데이터는 변하지 않음)

## 주의사항

- PUBG API는 계정당 최근 200게임까지 relationship에 포함됨 — 100은 안전한 범위
- `MAX_CONCURRENCY=3`, `MIN_INTERVAL_MS=100ms` rate limit 설정 그대로 유지
- skip-if-exists: `matches.pubgMatchId` + `playerMatchStats.playerId` 조합으로 판단
