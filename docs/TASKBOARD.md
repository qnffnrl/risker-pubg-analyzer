# TASKBOARD - Risker PUBG Analyzer 작업 현황판

> 최종 갱신: 2026-05-17 (T-027 텔레메트리 파이프라인 main 병합)

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

_없음_

## ✅ 완료

| ID | 작업명 | 유형 | 완료일 |
|----|--------|------|--------|
| T-027 | 텔레메트리 수집/저장 파이프라인 (match_telemetry, telemetry-fetch 큐, 백필 로직) | feat | 2026-05-17 |
| T-026 | 분석 지표 고도화 (일관성/결정력 신규 카테고리, 공격성/생존 지표 확장, PNG 다운 /og 경로 버그) | feat+fix | 2026-05-17 |
| T-019 | 공유 기능 (OG 메타태그, SVG OG 이미지, 링크 복사, Canvas PNG 저장) | feat | 2026-05-17 |
| T-018 | 관리자 페이지 (HMAC 인증, 트래픽 통계 API, 대시보드 UI) | feat | 2026-05-17 |
| T-020 | 시즌 & 모드 필터 (필터바, URL 쿼리 동기화, 모드별 비교 카드) | feat | 2026-05-17 |
| T-025 | Refresh UX 개선 (폴링 완료 감지, 자동 리로드, 랭크 빈 상태 안내) | feat | 2026-05-17 |
| T-024 | 매치 상세 페이지 (included_data 저장, /matches API, SSR 상세 페이지, 404 graceful 처리) | feat | 2026-05-17 |
| T-023 | 랭크 통계 (ranked_stats, 티어 배지, SVG 엠블럼, KDA 계산) | feat | 2026-05-17 |
| T-017 | 성과 추이 차트 (라인 차트, 폼 분석, 핫스트릭/슬럼프) | feat | 2026-05-17 |
| T-022 | 맵 이름 매핑 보완 + 생존전 모드 필터 | fix | 2026-05-17 |
| T-021 | 매치 수집 한도 100으로 증가 + Skip-if-exists + 분석 limit 제거 | feat | 2026-05-17 |
| T-016 | 맵 & 존 분석 (맵별 성적, 강점 맵, 이동 패턴) | feat | 2026-05-17 |
| T-015 | 무기 & 교전 분석 (weapon_stats DB, Mastery 수집, /weapons API, 무기 탭 UI) | feat | 2026-05-16 |
| T-014 | CI/CD (GitHub Actions → risker.co.kr SSH:2222, 헬스체크, README) | infra | 2026-05-16 |
| T-013 | 플레이어 비교 기능 (/compare 페이지, 오버레이 레이더 차트, 지표 테이블) | feat | 2026-05-16 |
| T-012 | 로컬 스토리지 훅 분리 + 즐겨찾기/최근 검색 크로스탭 동기화 | feat | 2026-05-16 |
| T-011 | LLM 성향 자연어 요약 (claude CLI + AutoRefresh 버그픽스) | feat | 2026-05-16 |
| T-010 | 플레이 스타일 분석 대시보드 (레이더 차트 + 지표 카드) | feat | 2026-05-16 |
| T-009 | 플레이어 프로필 + 최근 매치 목록 페이지 | feat | 2026-05-17 |
| T-008 | 플레이어 검색 페이지 (닉네임 + 플랫폼 선택, 랜딩) | feat | 2026-05-17 |
| T-007 | 분석 결과 API (Hono + 트래픽 로깅 미들웨어) | feat | 2026-05-17 |
| T-006 | 플레이 스타일 분석 엔진 (4대 성향 통계) | feat | 2026-05-17 |
| T-005 | 플레이어 검색 + 매치 수집 Worker (BullMQ) | feat | 2026-05-17 |
| T-004 | PUBG API 클라이언트 (Rate Limit + Zod 검증) | feat | 2026-05-16 |
| T-003 | 앱 컨테이너화 (Dockerfile + docker-compose.prod.yml) | infra | 2026-05-16 |
| T-002 | DB 스키마 설계 (플레이어/매치/분석 결과/트래픽 테이블) | infra | 2026-05-16 |
| T-000 | 디자인 시스템 & 글로벌 레이아웃 | design | 2026-05-16 |
| T-001 | 모노레포 스캐폴딩 (Next.js + Hono + BullMQ Worker) | infra | 2026-05-16 |

## 📋 대기

### Phase 5: 실력 향상 코칭 (텔레메트리 기반)

| ID | 작업명 | 유형 | PRD | 진행률 |
|----|--------|------|-----|--------|
| T-028 | 약점 진단 룰 엔진 + AI 코칭 메시지 | feat | [PRD](prd/T-028-PRD-20260517-weakness-rule-engine.md) | 100% |
| T-029 | 킬/데스 히트맵 (맵별 시각화) | feat | [PRD](prd/T-029-PRD-20260517-death-killmap.md) | 100% |
| T-030 | 4축 성향 점수 리팩토링 (실력 의존도 분리) | feat | [PRD](prd/T-030-PRD-20260517-score-v2-refactor.md) | 0% |
| T-031 | 자가 비교 (과거의 나 vs 현재의 나) | feat | [PRD](prd/T-031-PRD-20260517-self-comparison.md) | 0% |

### Phase 4: 고도화

| ID | 작업명 | 유형 | PRD | 진행률 |
|----|--------|------|-----|--------|

---

## 📝 최근 변경 이력

| 날짜 | 구분 | 내용 | 커밋해시 |
|------|------|------|---------|
| 2026-05-17 | feat | T-029 킬/데스 히트맵 — aggregator/SVG MapHeatmap/지명 매핑/히트맵 탭 | 380127d |
| 2026-05-17 | feat | T-028 약점 진단 룰 엔진 7개(R001~R007) + R101/R105 Tier2 + WeaknessCard UI + AI 코칭 메시지 교체 | 187c10f |
| 2026-05-17 | feat | T-027 텔레메트리 파이프라인 — match_telemetry 테이블, telemetry-fetch BullMQ 큐, getTelemetry CDN 다운로드, 기존 매치 백필 로직, loader.ts, migration 0007 + main 병합 | d1eab7d |
| 2026-05-17 | feat+fix | T-026 분석 지표 고도화 — 공격성/생존 지표 확장, 일관성/결정력 신규 카테고리, 6축 레이더 차트, migration 0005/0006, PNG 다운 /og 경로 버그 수정 + main 병합 | 4b5b89c |
| 2026-05-17 | feat | T-019 공유 기능 — /og 동적 OG 이미지(SVG), generateMetadata OG/Twitter 태그, 링크 복사 버튼(2초 복사됨! 피드백), PNG 저장 버튼 | eb85009 |
| 2026-05-17 | feat | T-018 관리자 페이지 — HMAC 일일 토큰 인증, 트래픽 통계 API(summary/traffic/popular-players/logs/queue), 관리자 로그인 + 대시보드 UI + main 병합 | c865d3c |
| 2026-05-17 | feat | T-020 시즌 & 모드 필터 — 필터바(모드/맵/기간), URL 쿼리 동기화, 모드별 비교 카드, MatchList 더보기 offset 개선 | b94f3ae |
| 2026-05-17 | feat | T-025 Refresh UX — 새로고침 폴링 완료 감지 자동 리로드 + 타임아웃 에러 메시지 + 랭크 빈 상태 안내 | 13562c8 |
| 2026-05-17 | fix | CI/CD — pubg_postgres 컨테이너 이름 충돌 수정(migration 전 down 추가) + worker Zod input/output 타입 캐스트 | 780e619 |
| 2026-05-17 | fix | CI/CD — 컨테이너 재시작 전 down --remove-orphans 추가, Drizzle journal 타임스탬프 오름차순 보정 | d709c96 |
| 2026-05-17 | feat | T-024 매치 상세 페이지 — included_data DB 저장, GET /matches/:matchId API, /matches/[matchId] SSR 페이지, 참가자/팀 테이블, 텔레메트리 URL, MatchCard 상세 링크 + main 병합 | 4ebd8fd |
| 2026-05-17 | feat | T-023 랭크 통계 — ranked_stats DB, getRankedStats API, RankedView + SVG 엠블럼 + main 병합 | 7b3b43c |
| 2026-05-17 | feat | T-017 성과 추이 차트 — 라인 차트, 폼 분석 카드, 핫스트릭/슬럼프 배지 + main 병합 | 80f1b27 |
| 2026-05-17 | fix | T-022 맵 이름 매핑 보완(DihorOtok/Summerland) + /maps 생존전 모드 필터 + main 병합 | be403c2 |
| 2026-05-17 | feat | T-021 matchLimit 100 증가 + skip-if-exists + 분석 limit(20) 제거 + main 병합 | 2f4f15f |
| 2026-05-17 | feat | T-016 맵 & 존 분석 — /maps API, MapView UI, 맵 탭 + main 병합 | 6070b98 |
| 2026-05-17 | fix | T-015 무기 ID 전면 정정(AK47_C 등) + LongestDefeat 사용 + 교전거리 분포 차트 추가 + main 병합 | 85d9e26 |
| 2026-05-17 | fix | T-015 최장 킬 거리 버그 수정 (LongestKill 0 필터링) + 주력 콤보 AR+DMR/SR 로직 + main 병합 | 29b54b2 |
| 2026-05-16 21:07 | feat | T-015 무기 & 교전 분석 — weapon_stats 스키마/마이그레이션, playerFetch 무기수집, /weapons API, WeaponView+PlayerTabs 탭 UI | ce8ec35 |
| 2026-05-16 19:30 | infra | T-014 CI/CD 완료 — GitHub Actions deploy, --env-file, Dockerfile ARG, claude 권한 해결 | 72f385c |
| 2026-05-16 18:40 | feat | T-013 플레이어 비교 main 병합 — /compare 3-상태 SSR, 오버레이 레이더 차트, 성향 바, 지표 테이블, URL 복사, 모바일 탭, 프로필 헤더 비교 버튼 | 3c41589 |
| 2026-05-16 18:20 | fix | T-012 사이드바 localStorage 연결 — sidebar.tsx placeholder → useRecentSearches/useFavorites 실제 데이터 표시 | 223ff3e |
| 2026-05-16 18:10 | feat | T-012 로컬 스토리지 훅 분리 main 병합 — useFavorites/useRecentSearches 크로스탭 sync, avatarColor 고정, player-header 리팩터 | 456b551 |
| 2026-05-16 17:50 | feat | T-011 LLM 요약 main 병합 — claude CLI execFile, bash+npm 설치, ~/.claude 볼륨마운트, forceRefresh 체인 버그픽스, AutoRefresh+MatchList 동기화 | ea667b5 |
| 2026-05-16 16:34 | feat | T-010 분석 대시보드 main 병합 — /analysis 페이지(SSR), 레이더 차트 대형, 성향 레이블 12종, 4대 지표 Section+StatCard, style-label.ts | 2029477 |
| 2026-05-17 04:00 | feat | T-009 프로필 페이지 병합 — PlayerHeader/SummaryStats/StylePreview/MatchList, 레이더차트, 매치카드, 즐겨찾기, 모드필터, SSR API_URL 분리 | 6855d9c |
| 2026-05-17 03:00 | feat | T-008 검색 페이지 병합 — SearchBar API+폴링, localStorage, api-client, participant.stats.playerId 버그픽스, play_style_analyses unique constraint | d143804 |
| 2026-05-17 02:00 | feat | T-007 분석 결과 API 병합 — players/jobs/compare 라우트, 트래픽 로깅 미들웨어(IP 마스킹), CORS, @hono/zod-validator 검증 | e3cd31c |
| 2026-05-17 01:00 | feat | T-006 분석 엔진 main 병합 — 4대 성향(공격성/생존/포지셔닝/팀플) 순수 함수, clamp 정규화, analysis 프로세서, play_style_analyses upsert | ad80540 |
| 2026-05-17 00:00 | feat | T-005 BullMQ 워커 구현 — playerFetch/matchCollection 프로세서, @risker/db 연동, 캐시 체크, job payload Zod 스키마 | a9921f4 |
| 2026-05-16 23:30 | feat | T-004 PUBG API 클라이언트 병합 — PubgApiClient(rate limit/retry), Zod 스키마(player/match/season/stats/weapon), Shard/MAP 상수 | 1eb37bf |
| 2026-05-16 23:00 | infra | T-003 컨테이너화 병합 — web/api/worker Dockerfile(멀티스테이지), docker-compose.prod.yml, Drizzle 마이그레이션 SQL, migrate.ts | 54fcfd0 |
| 2026-05-16 22:30 | infra | T-002 DB 스키마 병합 — players/matches/playerMatchStats/playStyleAnalyses/analysisJobs/trafficLogs, pgEnum, 인덱스 | eabff3c |
| 2026-05-16 22:00 | feat | T-000 main 병합 완료 — 디자인 시스템 & 글로벌 레이아웃 (AppShell/Header/Sidebar/BottomNav, StatCard/RadarChart/StyleBadge 등) | b54b160 |
| 2026-05-16 21:00 | feat | T-000 디자인 시스템 구현 — AppShell/Header/Sidebar/BottomNav 레이아웃, StatCard/PlayerAvatar/RadarChart/StyleBadge/PlatformBadge/LoadingSkeleton UI, CSS 변수 보완, Tailwind 애니메이션 추가 | 6ceedf9 |
| 2026-05-16 20:00 | infra | T-001 모노레포 스캐폴딩 완료 — web/api/worker/shared/db 앱 뼈대 구현, turbo build 전체 통과 | bfc3c38 |
| 2026-05-16 18:00 | docs | 전체 PRD 21개 생성 (T-000~T-020) + GitHub Actions 워크플로우 | - |
| 2026-05-16 17:00 | infra | 프로젝트 초기 생성 (모노레포 스캐폴딩 + CLAUDE.md + docs) | 45e4f60 |
