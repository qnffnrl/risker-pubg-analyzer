# PRD INDEX - Risker PUBG Analyzer

> PRD 카탈로그 및 진행 상태.
> 모든 PRD 파일: `docs/prd/T-{NNN}-PRD-YYYYMMDD-<name>.md`
> 완료된 PRD: `docs/prd/done/`

## 상태 범례
- `📋 대기` — 미시작
- `🔥 진행중` — 개발 진행 중
- `✅ 완료` — main 병합 완료
- `⏸️ 보류` — 일시 중단

## PRD 목록

### Phase 0: 디자인 시스템

| ID | 상태 | 제목 | PRD 파일 | 완료일 |
|----|------|------|---------|--------|
| T-000 | ✅ 완료 | 디자인 시스템 & 글로벌 레이아웃 | [T-000](done/T-000-PRD-20260516-design-system.md) | 2026-05-16 |

### Phase 1: 기반 인프라

| ID | 상태 | 제목 | PRD 파일 | 완료일 |
|----|------|------|---------|--------|
| T-001 | ✅ 완료 | 모노레포 스캐폴딩 (Next.js + Hono + BullMQ) | [T-001](done/T-001-PRD-20260516-monorepo-scaffold.md) | 2026-05-16 |
| T-002 | ✅ 완료 | DB 스키마 설계 (Drizzle + PostgreSQL) | [T-002](done/T-002-PRD-20260516-db-schema.md) | 2026-05-16 |
| T-003 | ✅ 완료 | 앱 컨테이너화 (Dockerfile + docker-compose) | [T-003](done/T-003-PRD-20260516-containerization.md) | 2026-05-16 |
| T-014 | 📋 대기 | CI/CD (GitHub Actions → risker.co.kr) | [T-014](T-014-PRD-20260516-cicd.md) | - |

### Phase 2: 핵심 데이터 파이프라인

| ID | 상태 | 제목 | PRD 파일 | 완료일 |
|----|------|------|---------|--------|
| T-004 | ✅ 완료 | PUBG API 클라이언트 (Rate Limit + Zod 검증) | [T-004](done/T-004-PRD-20260516-pubg-api-client.md) | 2026-05-16 |
| T-005 | ✅ 완료 | 플레이어 검색 + 매치 수집 Worker (BullMQ) | [T-005](done/T-005-PRD-20260516-match-collection-worker.md) | 2026-05-17 |
| T-006 | ✅ 완료 | 플레이 스타일 분석 엔진 (4대 성향 통계) | [T-006](done/T-006-PRD-20260516-analysis-engine.md) | 2026-05-17 |
| T-007 | ✅ 완료 | 분석 결과 API (Hono + 트래픽 로깅) | [T-007](done/T-007-PRD-20260516-analysis-api.md) | 2026-05-17 |

### Phase 3: 프론트엔드 핵심

| ID | 상태 | 제목 | PRD 파일 | 완료일 |
|----|------|------|---------|--------|
| T-008 | ✅ 완료 | 플레이어 검색 페이지 (랜딩/홈) | [T-008](done/T-008-PRD-20260516-search-page.md) | 2026-05-17 |
| T-009 | ✅ 완료 | 플레이어 프로필 + 매치 목록 페이지 | [T-009](done/T-009-PRD-20260516-player-profile-page.md) | 2026-05-17 |
| T-010 | ✅ 완료 | 플레이 스타일 분석 대시보드 (레이더 차트) | [T-010](done/T-010-PRD-20260516-analysis-dashboard.md) | 2026-05-16 |
| T-012 | ✅ 완료 | 로컬 스토리지 (최근 검색 + 즐겨찾기, 로그인 없음) | [T-012](done/T-012-PRD-20260516-local-storage.md) | 2026-05-16 |

### Phase 4: 고도화 기능

| ID | 상태 | 제목 | PRD 파일 | 완료일 |
|----|------|------|---------|--------|
| T-011 | ✅ 완료 | LLM 성향 자연어 요약 (Claude CLI) | [T-011](done/T-011-PRD-20260516-llm-summary.md) | 2026-05-16 |
| T-013 | ✅ 완료 | 플레이어 비교 기능 (오버레이 레이더 차트) | [T-013](done/T-013-PRD-20260516-player-comparison.md) | 2026-05-16 |
| T-015 | 📋 대기 | 무기 & 교전 분석 (선호 무기 Top10, 교전 거리) | [T-015](T-015-PRD-20260516-weapon-analysis.md) | - |
| T-016 | 📋 대기 | 맵 & 존 분석 (맵별 성적, 랜딩존 선호) | [T-016](T-016-PRD-20260516-map-zone-analysis.md) | - |
| T-017 | 📋 대기 | 성과 추이 차트 (시계열 라인 차트, 폼 분석) | [T-017](T-017-PRD-20260516-performance-trend.md) | - |
| T-018 | 📋 대기 | 관리자 페이지 (트래픽 모니터링 + 비밀번호 인증) | [T-018](T-018-PRD-20260516-admin-page.md) | - |
| T-019 | 📋 대기 | 공유 기능 (OG 이미지 + 링크 복사 + PNG 저장) | [T-019](T-019-PRD-20260516-share-feature.md) | - |
| T-020 | 📋 대기 | 시즌 & 모드 필터 (스쿼드/솔로/맵별 분석) | [T-020](T-020-PRD-20260516-season-mode-filter.md) | - |

---

## 개발 순서 (권장)

```
T-001 → T-000 → T-002 → T-003 → T-004
  ↓
T-005 → T-006 → T-007
  ↓
T-008 → T-012 → T-009 → T-010
  ↓
T-011, T-013, T-014 (병렬)
  ↓
T-015, T-016, T-017, T-018, T-019, T-020 (병렬)
```

## 배포 정보

| 항목 | 값 |
|------|-----|
| 앱 URL | `https://pubg.risker.co.kr` |
| 서버 | Mac Mini @ risker.co.kr |
| SSH 포트 | 2222 |
| 배포 방식 | GitHub Actions → SSH → Docker Compose (호스트 완전 격리) |
| PUBG API 문서 | https://documentation.pubg.com/en/introduction.html |
