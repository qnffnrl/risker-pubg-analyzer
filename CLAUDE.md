# CLAUDE.md — Risker PUBG Analyzer

> **PUBG 플레이 스타일 분석 웹/앱**
> PUBG API(Krafton)를 통해 매치 데이터를 수집하고 플레이 성향(공격성·생존형·포지셔닝 등)을 분석·시각화.
> 전체 스택을 **Node.js / TypeScript**로 통일.

## 시스템 구성

**MSA 아키텍처** — 3개 서비스(`web`, `api`, `worker`) + 인프라 컨테이너(`postgres`, `redis`)

각 서비스는 **독립 Docker 컨테이너**로 배포. 로컬은 docker-compose.

```
apps/
  web/      # Next.js 14+ (App Router) — 플레이어 검색, 전적, 분석 대시보드
  api/      # Hono BE — 플레이어 조회, 분석 트리거, 결과 캐시 API
  worker/   # BullMQ Worker — PUBG API 수집 + 플레이 스타일 분석 연산
packages/
  shared/   # Zod 스키마, 타입 (web/api/worker 공유)
  db/       # Drizzle 스키마 + 마이그레이션
docs/
.claude/
```

## 데이터 흐름

```
사용자 닉네임 검색
  → [api] PUBG API 플레이어 ID 조회
  → [worker] 최근 매치 목록 + 매치 상세 수집 (BullMQ job)
  → [worker] 플레이 스타일 분석 연산
      - 공격성: 킬/데미지/헤드샷율/교전 시작률
      - 생존형: 생존시간/부스터사용/무기교환시점
      - 포지셔닝: 이동거리/이동수단/로딩존 선호도/엔딩존 위치
      - 팀플: 부활/구조 횟수/핑 사용 패턴
  → [db] PostgreSQL에 분석 결과 저장 (캐시 TTL 포함)
  → [api] 분석 결과 조회 + LLM 성향 요약 (Claude API, 선택)
  → [web] 대시보드 렌더링
```

## 배포 환경 (TBD)

| 항목 | 값 |
|------|----|
| 호스팅 | TBD (Home Server 또는 VPS) |
| 배포 방식 | Docker Compose → Kubernetes (확장 시) |
| CI/CD | TBD (GitHub Actions 예정) |

## 참조 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| 작업 현황판 | `docs/TASKBOARD.md` | 전체 작업 현황 (Source of Truth) |
| PRD 인덱스 | `docs/prd/PRD-INDEX.md` | PRD 카탈로그 및 진행 상태 |
| BE Agent 지침 | `.claude/agents/be-agent.md` | Backend (Hono + Drizzle) 개발 규칙 |
| FE Agent 지침 | `.claude/agents/fe-agent.md` | Frontend (Next.js) 개발 규칙 |
| Worker Agent 지침 | `.claude/agents/worker-agent.md` | PUBG API 수집 + 분석 워커 규칙 |
| Feature Dev 지침 | `.claude/agents/feature-dev.md` | 개발 오케스트레이터 규칙 |

---

## 서버 프로세스 실행 규칙

Claude가 Bash 툴로 dev 서버(`next dev`, `tsx watch`, BullMQ worker 등)를 실행하면 **세션 종료 후에도 프로세스가 백그라운드에 남아** 다음 실행 시 포트 충돌 / 작업 중복 실행이 발생한다.

### 규칙
- **서버를 Bash로 직접 실행하지 않는다** — 테스트 목적이라도 금지
- 만약 실행이 불가피한 경우, 완료 후 반드시 사용자에게 고지:
  > "⚠️ 백그라운드에 node 프로세스가 남아있을 수 있습니다. 재시작 전 정리하세요."
  > Windows: `taskkill /F /IM node.exe`
- 포트 충돌 (Next 3000, Hono 3001 등) 발생 시 원인 설명 + 정리 방법 안내

---

## CRITICAL RULES

### Git 브랜치 전략 (Feature Branch 필수)
- **모든 개발은 feature branch에서 수행** — main에 직접 커밋 금지
- 브랜치명: `feature/T-{번호}-{간략설명}` (예: `feature/T-001-monorepo-scaffold`)
- **사용자 검증 완료 후에만 main 병합** — 개발 완료 시 사용자에게 검증 요청, 승인 후 merge
- 배포는 사용자 명시 요청 시에만 수행

### 변경 이력 기록 (커밋 시 필수)
- **모든 작업** 커밋 시 `docs/TASKBOARD.md`의 **최근 변경 이력** 테이블에 기록
- 형식: `| 날짜 | 구분 | 내용 | 커밋해시 |` (날짜는 `YYYY-MM-DD HH:MM` 형식)
- 구분 예시: `feat`, `fix`, `refactor`, `style`, `docs`, `infra`
- 최신 항목을 테이블 상단에 추가

### 기술 스택 (전 스택 Node.js / TypeScript 통일)

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 언어 | TypeScript (strict) | Node 20 LTS |
| 패키지 매니저 | pnpm + Turborepo | 모노레포 |
| Frontend | Next.js 14+ (App Router) + TailwindCSS + shadcn/ui | `apps/web/` |
| Backend | Hono + Drizzle ORM + Zod | `apps/api/` |
| Worker | BullMQ + Zod 파싱 (분석 엔진 + LLM 요약은 Claude API) | `apps/worker/` |
| RDBMS | PostgreSQL (플레이어 캐시 + 매치 데이터 + 분석 결과) | |
| 외부 API | PUBG API (Krafton) — `fetch` + Zod 검증 | Rate limit 유의 |
| LLM | Claude API (성향 자연어 요약, 선택적) | `apps/worker` 또는 `apps/api`에서 호출 |
| 메시지 큐 | Redis (BullMQ broker) | |
| 검증/스키마 | Zod (web/api/worker 공유) | `packages/shared`에서 공유 |
| 컨테이너 | Docker / docker-compose | 추후 K8s 전환 |

---

## 기능 개발 워크플로우

### 자동 모드 (기본)

```
/dev "기능 요청"
  ├─ [자동] 요구사항 분석 (모호하면 질문)
  ├─ [자동] PRD 생성 (docs/prd/)
  ├─ [🔴 GATE] 사용자에게 PRD 요약 보고 → 승인 대기
  ├─ [승인 후] Feature branch 생성 + 태스크 분해
  ├─ [자동] feature-dev Sub Agent 실행
  │    ├─ BE Agent (Hono API/모델/인증)
  │    ├─ FE Agent (Next.js UI/대시보드)
  │    └─ Worker Agent (PUBG API 수집/분석)
  ├─ [자동] 코드 검증 + 테스트
  ├─ [자동] Feature branch 커밋
  ├─ [🔴 GATE] 사용자 검증 요청 → 검증 대기
  └─ [검증 후] main 병합 + TASKBOARD/PRD 완료 처리 + branch 삭제
```

### 🔴 모든 코드 변경은 /dev 필수 (예외 없음)
- **모든 코드 변경** (feature/bug/improvement/refactor, 아무리 작아도) → **반드시 `/dev` 사용**
- "단순 수정", "버그 한 줄 수정", "작은 변경"도 예외 없음
- `/dev` 없이 직접 코드를 수정하는 것은 **금지**
- 질의응답, 조회, 분석 등 코드 변경이 없는 작업만 `/dev` 없이 수행 가능

### 필수 수행 절차 (모든 코드 변경에 적용)
1. **Feature branch 생성** — `feature/T-{번호}-{간략설명}` (main 직접 커밋 금지)
2. **PRD 작성** — `/dev` 내부에서 자동 생성, 아무리 작아도 필수
3. **사용자 승인** — PRD 요약 보고 후 명시적 승인 대기
4. **TASKBOARD 태스크 등록** — 작업 시작 전 등록
5. **🔴 개발 수행 — 반드시 feature-dev Sub Agent로 위임** (메인 세션에서 직접 코드 수정 금지)
6. **커밋 전 필수 체크리스트 수행**
7. **커밋** — feature branch에 자동 커밋
8. **🔴 사용자 검증 요청** — 검증 대기 (여기서 반드시 멈춤)
9. **사용자 검증 승인 후 main 병합** — 승인 없이 merge 금지
10. **TASKBOARD 완료 처리** — 태스크 상태 업데이트 + 변경 이력 기록 (**main 병합 후에만**)
11. **PRD 상태 업데이트** — PRD-INDEX.md + PRD 문서 상태 갱신 (**main 병합 후에만**)
12. **Feature branch 삭제** — `git branch -d feature/T-{번호}-...`

### 🔴 커밋 전 필수 체크리스트
1. ✅ 코드 품질/재사용성/효율성 검증
2. ✅ 기능 테스트 수행 (서버 미실행 시 스킵 사유 명시)
3. ✅ **lessons-learned 검토** — 반드시 명시적으로 출력. 묵시적 스킵 금지.
4. ✅ TASKBOARD 변경 이력 기록 준비
5. ✅ 시크릿/API 키 누출 여부 확인 (.env, 로그, 커밋 diff)

### 🔴 코드 변경 요청 감지 규칙 (입구 차단)
아래 패턴이 감지되면 **무조건 `/dev` 스킬을 사용**한다:
- **화면/UI 수정**: "~표시해줘", "~변경해줘", "~추가해줘", "~제거해줘", "~숨겨줘", "~보여줘"
- **기능 요청**: "~할 수 있게 해줘", "~되도록 해줘", "~기능 넣어줘"
- **버그/수정**: "~안 돼", "~깨졌어", "~오류가 나", "~수정해줘"
- **수집/분석**: "~수집해줘", "~분석 추가", "~지표 바꿔줘"

**예외 (직접 처리 가능 — `/dev` 불필요):**
- 코드 변경 없는 질문/설명/조회
- CLAUDE.md, docs/ 등 개발 프로세스 문서 자체의 수정
- git 작업 (커밋, 릴리즈 등)

### 🔴 코드 파일 Edit/Write 전 필수 자기 점검
소스 코드 파일을 Edit/Write 하기 전에 **반드시 자문**:
> "이 작업은 `/dev`를 거쳤는가?"
- **No** → 즉시 중단, `/dev` 실행
- **Yes** → 진행

---

## Sub-Agent 구조

feature-dev → be-agent + fe-agent + worker-agent 구조로 동작:

| Agent | 프롬프트 | 역할 |
|-------|---------|-----|
| feature-dev | `.claude/agents/feature-dev.md` | 오케스트레이터, 통합 검증 |
| be-agent | `.claude/agents/be-agent.md` | Hono API, 플레이어 조회, 분석 결과 API |
| fe-agent | `.claude/agents/fe-agent.md` | Next.js UI, 검색, 대시보드 |
| worker-agent | `.claude/agents/worker-agent.md` | PUBG API 수집, 분석 연산, BullMQ |

---

## 외부 스킬/도구 충돌 규칙

외부 도구의 기본 동작이 이 CLAUDE.md 규칙과 충돌할 경우, **항상 CLAUDE.md(프로젝트 룰)를 우선**한다.

| 항목 | 외부 스킬 기본값 | 프로젝트 룰 (우선 적용) |
|------|-----------------|------------------------|
| PRD/Plan 문서 경로 | `docs/01-plan/features/*.plan.md` | `docs/prd/T-{NNN}-PRD-YYYYMMDD-<name>.md` |

---

## PRD 관리
- **자동 생성**: `/dev` 실행 시 내부적으로 PRD 생성
- **저장**: `docs/prd/T-{NNN}-PRD-YYYYMMDD-<feature-name>.md`
- **인덱스**: `docs/prd/PRD-INDEX.md`
- **완료**: `docs/prd/done/`로 이동

### 핵심 규칙
- 🔴 **모든 코드 변경은 `/dev` 필수** — feature/bug/improvement/refactor 무관, 예외 없음
- 🔴 **PRD 필수** → 아무리 작은 수정이라도 PRD 생성
- 🔴 **사용자 승인 필수** → PRD 승인 전 코드 수정 금지
- 🔴 **TASKBOARD 등록/완료 필수** → 태스크 등록 → 개발 → 완료 처리
- 🔴 **Sub Agent 위임 필수** → 메인 세션 직접 코드 수정 금지
- BE/FE/Worker 독립 작업은 병렬 실행
