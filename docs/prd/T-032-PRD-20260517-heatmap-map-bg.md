# T-032 PRD — 히트맵 맵 배경 이미지 + 이름 수정

**날짜:** 2026-05-17  
**상태:** in-progress

## 목표
히트맵에 실제 PUBG 맵 배경 이미지를 표시하고, 내부 API 이름(Baltic_Main 등)을 사용자 친화적 이름(에란겔 등)으로 교정한다.

## 버그 수정
1. `MAP_LANDMARKS` 키가 `Erangel_Main`인데 API는 `Baltic_Main` 반환 → 랜드마크 항상 "알 수 없는 지역"
2. `Baltic_Main` → "Baltic" 식으로 표시 → 사용자가 맵 구분 불가

## 구현 범위

### maps.ts
- `MAP_DISPLAY_NAMES`: 내부 키 → 한국어 표시명 (에란겔, 미라마르 등)
- `MAP_IMAGE_URLS`: 내부 키 → 커뮤니티 CDN 이미지 URL
- `MAP_LANDMARKS` 키를 `Baltic_Main` 기준으로 통일

### MapHeatmap.tsx
- `<img>` 태그로 맵 이미지 배경 추가 (SVG 아래에 absolute 레이어)
- 이미지 로드 실패 시 기존 그리드 폴백

### player-tabs.tsx
- 맵 섹션 헤더에 `MAP_DISPLAY_NAMES` 적용
- "최근 N매치 기준" 표기 추가

## 맵 이미지 소스
외부 URL (커뮤니티 CDN) — binary 파일을 git에 추가하지 않음
