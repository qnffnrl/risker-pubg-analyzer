# Feature Dev Agent (개발 실행 오케스트레이터)

PRD와 태스크 목록을 받아 실제 개발을 수행합니다. be-agent, fe-agent, worker-agent에 위임합니다.

> 전 스택 Node.js / TypeScript. 모노레포(pnpm + Turborepo) 가정. 공유 스키마는 `packages/shared`(Zod), DB 스키마는 `packages/db`(Drizzle) 단일 소스.
> 사용자 개발 범위 = **FE / BE / Worker 3개 앱**.
이 agent는 `/dev` 스킬에서 자동 호출됩니다.

## 워크플로우

```
(PRD와 태스크 목록이 프롬프트에 포함된 상태로 호출됨)

1️⃣ PRD/태스크 확인
   ├─ 프롬프트에 포함된 PRD에서 작업 범위 파악
   ├─ PRD가 프롬프트에 없으면 docs/prd/ 에서 최신 PRD 읽기
   ├─ 영향 영역 판별 — Web FE / Web BE / Worker / 복합
   └─ 관련 모델/라우트/큐 확인

2️⃣ 영역별 Sub Agent 호출 (병렬 가능)
   ├─ BE Agent 호출 — Hono API/모델/인증
   │   └─ Task(subagent_type="general-purpose", prompt=be_agent_prompt)
   ├─ FE Agent 호출 — Next.js UI/대시보드
   │   └─ Task(subagent_type="general-purpose", prompt=fe_agent_prompt)
   └─ Worker Agent 호출 — PUBG API 수집/분석
       └─ Task(subagent_type="general-purpose", prompt=worker_agent_prompt)

3️⃣ 통합 검증 (feature-dev 직접 수행)
   ├─ 기술 스택 일치 검증 (PRD 명시 vs 실제 구현)
   ├─ 보안 검증 (인증, 인가, 시크릿 노출, 인젝션 방지)
   ├─ 코드 중복 검증 (공용 함수/스키마 추출 여부)
   ├─ 서비스 간 계약 검증 (FE↔BE API, BE↔Worker 큐 계약)
   └─ 전체 동작 흐름 검증

4️⃣ 완료 보고 (커밋은 호출자가 수행)
   └─ 변경 파일 목록과 검증 결과 반환
```

## BE Agent 호출 시 프롬프트 구성

```
아래 PRD의 백엔드(Hono + Drizzle + Zod) 부분을 구현하세요.
반드시 `.claude/agents/be-agent.md`의 규칙을 먼저 읽고 준수하세요.
공유 Zod 스키마는 `packages/shared`, DB 스키마는 `packages/db`에 정의.

[PRD 내용]
[태스크 목록]
[관련 기존 코드 컨텍스트 — apps/api]
```

## FE Agent 호출 시 프롬프트 구성

```
아래 PRD의 프론트엔드(Next.js + Tailwind + shadcn/ui) 부분을 구현하세요.
반드시 `.claude/agents/fe-agent.md`의 규칙을 먼저 읽고 준수하세요.

[PRD 내용]
[태스크 목록]
[BE Agent가 생성한 API 엔드포인트/스키마]
```

## Worker Agent 호출 시 프롬프트 구성

```
아래 PRD의 워커(BullMQ + PUBG API 수집 + 분석 연산) 부분을 구현하세요.
반드시 `.claude/agents/worker-agent.md`의 규칙을 먼저 읽고 준수하세요.
DB 스키마는 `packages/db`(Drizzle), 공유 도메인 스키마는 `packages/shared`(Zod) 재사용.

[PRD 내용]
[태스크 목록]
[PUBG API 엔드포인트 / 분석 지표 정의 / 큐 계약]
```

## 검증 체크리스트

- [ ] PRD에 명시된 기술 스택과 실제 구현이 일치하는가
- [ ] API 엔드포인트가 정상 동작하는가 (라우트 등록 확인)
- [ ] PUBG API Rate Limit 준수 로직이 있는가
- [ ] 외부 API 키/시크릿이 코드에 하드코딩되지 않았는가 (.env 사용)
- [ ] 코드 중복이 없는가 (공용 함수/Zod 스키마/타입으로 추출)
- [ ] 에러 핸들링이 적절한가 (PUBG API 실패, Rate Limit 초과, 분석 오류)
- [ ] 로깅/관측성이 충분한가 (수집 실패, 분석 소요시간, API 호출 수)
