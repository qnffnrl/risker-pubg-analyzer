# TASKBOARD - Risker PUBG Analyzer 작업 현황판

> 최종 갱신: 2026-05-16 (T-004 구현 완료, 사용자 검증 대기)

## 🧭 기술 스택 결정사항

| 결정 | 내용 | 일자 |
|------|------|------|
| 언어/런타임 | Node.js 20 + TypeScript (전 스택 통일) | 2026-05-16 |
| 모노레포 | pnpm + Turborepo | 2026-05-16 |
| BE | Hono + Drizzle + Zod | 2026-05-16 |
| FE | Next.js 14 (App Router) + TailwindCSS + shadcn/ui | 2026-05-16 |
| Worker | BullMQ + PUBG API (fetch + Zod) | 2026-05-16 |
| DB | PostgreSQL (매치 캐시 + 분석 결과) | 2026-05-16 |
| LLM | Claude API (성향 자연어 요약, claude-haiku-4-5) | 2026-05-16 |
| 공유 스키마 | `packages/shared` (Zod) — FE/BE/Worker 단일 소스 | 2026-05-16 |
| 인증 | 로그인 없음 — 즐겨찾기/최근 검색은 브라우저 localStorage | 2026-05-16 |
| 관리자 인증 | 단일 비밀번호 (ADMIN_PASSWORD 환경 변수) | 2026-05-16 |
| 배포 | Docker Compose (호스트 완전 격리) + GitHub Actions | 2026-05-16 |
| 앱 URL | https://pubg.risker.co.kr | 2026-05-16 |
| SSH 포트 | 2222 | 2026-05-16 |

## 🔥 진행 중

| T-004 | PUBG API 클라이언트 (Rate Limit + Zod 검증) | feat | [PRD](prd/T-004-PRD-20260516-pubg-api-client.md) | 구현 완료 (검증 대기) |

## ✅ 완료

| ID | 작업명 | 유형 | 완료일 |
|----|--------|------|--------|
| T-003 | 앱 컨테이너화 (Dockerfile + docker-compose.prod.yml) | infra | 2026-05-16 |
| T-002 | DB 스키마 설계 (플레이어/매치/분석 결과/트래픽 테이블) | infra | 2026-05-16 |
| T-000 | 디자인 시스템 & 글로벌 레이아웃 | design | 2026-05-16 |
| T-001 | 모노레포 스캐폴딩 (Next.js + Hono + BullMQ Worker) | infra | 2026-05-16 |

## 📋 대기

### Phase 1: 기반 인프라

| ID | 작업명 | 유형 | PRD | 진행률 |
|----|--------|------|-----|--------|
| T-014 | CI/CD (GitHub Actions → risker.co.kr, SSH:2222) | infra | [PRD](prd/T-014-PRD-20260516-cicd.md) | 0% |

### Phase 2: 핵심 데이터 파이프라인

| ID | 작업명 | 유형 | PRD | 진행률 |
|----|--------|------|-----|--------|
| T-004 | PUBG API 클라이언트 (Rate Limit + Zod 검증) | feat | [PRD](prd/T-004-PRD-20260516-pubg-api-client.md) | 0% |
| T-005 | 플레이어 검색 + 매치 수집 Worker (BullMQ) | feat | [PRD](prd/T-005-PRD-20260516-match-collection-worker.md) | 0% |
| T-006 | 플레이 스타일 분석 엔진 (4대 성향 통계) | feat | [PRD](prd/T-006-PRD-20260516-analysis-engine.md) | 0% |
| T-007 | 분석 결과 API (Hono + 트래픽 로깅 미들웨어) | feat | [PRD](prd/T-007-PRD-20260516-analysis-api.md) | 0% |

### Phase 3: 프론트엔드 핵심

| ID | 작업명 | 유형 | PRD | 진행률 |
|----|--------|------|-----|--------|
| T-008 | 플레이어 검색 페이지 (닉네임 + 플랫폼 선택, 랜딩) | feat | [PRD](prd/T-008-PRD-20260516-search-page.md) | 0% |
| T-009 | 플레이어 프로필 + 최근 매치 목록 페이지 | feat | [PRD](prd/T-009-PRD-20260516-player-profile-page.md) | 0% |
| T-010 | 플레이 스타일 분석 대시보드 (레이더 차트 + 지표 카드) | feat | [PRD](prd/T-010-PRD-20260516-analysis-dashboard.md) | 0% |
| T-012 | 로컬 스토리지 (최근 검색 + 즐겨찾기, 로그인 없음) | feat | [PRD](prd/T-012-PRD-20260516-local-storage.md) | 0% |

### Phase 4: 고도화

| ID | 작업명 | 유형 | PRD | 진행률 |
|----|--------|------|-----|--------|
| T-011 | LLM 성향 자연어 요약 (Claude API, claude-haiku) | feat | [PRD](prd/T-011-PRD-20260516-llm-summary.md) | 0% |
| T-013 | 플레이어 비교 기능 (2명 오버레이 레이더 차트) | feat | [PRD](prd/T-013-PRD-20260516-player-comparison.md) | 0% |
| T-015 | 무기 & 교전 분석 (선호 무기 Top10, 교전 거리 분포) | feat | [PRD](prd/T-015-PRD-20260516-weapon-analysis.md) | 0% |
| T-016 | 맵 & 존 분석 (맵별 성적, 랜딩존 선호도) | feat | [PRD](prd/T-016-PRD-20260516-map-zone-analysis.md) | 0% |
| T-017 | 성과 추이 차트 (시계열 라인 차트, 폼 분석) | feat | [PRD](prd/T-017-PRD-20260516-performance-trend.md) | 0% |
| T-018 | 관리자 페이지 (트래픽 모니터링 + 비밀번호 인증) | feat | [PRD](prd/T-018-PRD-20260516-admin-page.md) | 0% |
| T-019 | 공유 기능 (OG 이미지 동적 생성 + PNG 저장) | feat | [PRD](prd/T-019-PRD-20260516-share-feature.md) | 0% |
| T-020 | 시즌 & 모드 필터 (스쿼드/솔로/듀오/맵별 분석) | feat | [PRD](prd/T-020-PRD-20260516-season-mode-filter.md) | 0% |

---

## 📝 최근 변경 이력

| 날짜 | 구분 | 내용 | 커밋해시 |
|------|------|------|---------|
| 2026-05-16 23:30 | feat | T-004 PUBG API 클라이언트 구현 — PubgApiClient(rate limit/retry), Zod 스키마(player/match/season/stats/weapon), Shard/MAP 상수, p-limit | (pending) |
| 2026-05-16 23:00 | infra | T-003 컨테이너화 병합 — web/api/worker Dockerfile(멀티스테이지), docker-compose.prod.yml, Drizzle 마이그레이션 SQL, migrate.ts | 54fcfd0 |
| 2026-05-16 22:30 | infra | T-002 DB 스키마 병합 — players/matches/playerMatchStats/playStyleAnalyses/analysisJobs/trafficLogs, pgEnum, 인덱스 | eabff3c |
| 2026-05-16 22:00 | feat | T-000 main 병합 완료 — 디자인 시스템 & 글로벌 레이아웃 (AppShell/Header/Sidebar/BottomNav, StatCard/RadarChart/StyleBadge 등) | b54b160 |
| 2026-05-16 21:00 | feat | T-000 디자인 시스템 구현 — AppShell/Header/Sidebar/BottomNav 레이아웃, StatCard/PlayerAvatar/RadarChart/StyleBadge/PlatformBadge/LoadingSkeleton UI, CSS 변수 보완, Tailwind 애니메이션 추가 | 6ceedf9 |
| 2026-05-16 20:00 | infra | T-001 모노레포 스캐폴딩 완료 — web/api/worker/shared/db 앱 뼈대 구현, turbo build 전체 통과 | bfc3c38 |
| 2026-05-16 18:00 | docs | 전체 PRD 21개 생성 (T-000~T-020) + GitHub Actions 워크플로우 | - |
| 2026-05-16 17:00 | infra | 프로젝트 초기 생성 (모노레포 스캐폴딩 + CLAUDE.md + docs) | 45e4f60 |
