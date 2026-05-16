# T-001 PRD — 모노레포 스캐폴딩

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: infra

## 목표

pnpm + Turborepo 기반 모노레포에 실제 동작하는 앱 뼈대(Next.js, Hono, BullMQ Worker)를 구성한다.
현재 `.gitkeep`만 있는 빈 디렉토리를 실제 프로젝트로 채운다.

## 범위

### apps/web (Next.js 14+)
- `create-next-app` 기반, App Router, TypeScript strict
- `next.config.mjs`: `output: 'standalone'` (서브도메인 운영, basePath 없음)
- TailwindCSS + shadcn/ui 초기화
- 환경 변수: `NEXT_PUBLIC_API_URL`

### apps/api (Hono)
- `hono` + `@hono/node-server`
- 포트: `8081`
- 라우터 구조: `/health`, `/api/v1/*`
- Zod 미들웨어 + cors + logger
- 환경 변수: `DATABASE_URL`, `REDIS_URL`, `PORT`

### apps/worker (BullMQ)
- BullMQ Worker + Bull Board (디버깅용 UI, `/admin/queues`)
- Queue 이름 상수: `packages/shared`에서 공유
- 환경 변수: `DATABASE_URL`, `REDIS_URL`, `PUBG_API_KEY`

### packages/shared
- Zod 스키마 + TypeScript 타입 (API 요청/응답, 큐 잡 타입)
- 빌드: `tsup`

### packages/db
- Drizzle ORM 설정 + `drizzle.config.ts`
- 연결: `DATABASE_URL`
- `drizzle-kit` 마이그레이션 CLI

### 루트 설정
- `turbo.json`: build/dev/lint/test 파이프라인
- `pnpm-workspace.yaml`: workspace 정의
- `.env.example` → 각 앱 `.env` 가이드
- `tsconfig.base.json`: strict TypeScript 공통 설정

## 기술 스펙

| 항목 | 버전 |
|------|------|
| Node.js | 20 LTS |
| pnpm | 9.x |
| Turborepo | 2.x |
| Next.js | 14.x |
| Hono | 4.x |
| BullMQ | 5.x |
| TypeScript | 5.x strict |
| tsup | 8.x |

## 완료 조건

- [ ] `pnpm install` 전체 성공
- [ ] `pnpm dev` — web(3000), api(3001), worker 동시 기동
- [ ] `apps/web` — `http://localhost:8080` 접속 확인
- [ ] `apps/api` — `GET /health` → `{ status: "ok" }` 응답
- [ ] `apps/worker` — BullMQ 연결 + Bull Board `/admin/queues` 접속
- [ ] `packages/shared` 타입이 web/api/worker에서 import 가능
- [ ] `packages/db` drizzle 클라이언트 초기화 성공 (DB 없어도 import OK)
- [ ] Turborepo 캐싱 동작 확인 (`turbo build`)

## 의존성

- 없음 (최초 태스크)
