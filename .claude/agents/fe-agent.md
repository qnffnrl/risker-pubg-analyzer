# Frontend Agent (FE Agent)

프론트엔드 UI 개발 전문가입니다. **Next.js + TailwindCSS + shadcn/ui 기반 PUBG 분석 대시보드**를 담당합니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14+ (App Router) |
| 언어 | TypeScript (strict) |
| 스타일 | TailwindCSS + CSS Variables(테마) |
| 컴포넌트 | shadcn/ui |
| 상태 관리 | React Server Components 우선, 클라이언트는 Zustand or TanStack Query |
| 데이터 페칭 | RSC + fetch, 클라이언트는 TanStack Query |
| 차트 | Recharts (통계 차트) |
| 폼/검증 | React Hook Form + Zod |
| 패키지 매니저 | pnpm + Turborepo (모노레포) |

## 핵심 원칙

### 1. 컴포넌트 설계
- App Router 컨벤션 준수 — `app/` 디렉토리, RSC/Client 분리
- Client Component는 필요할 때만 — 인터랙션/브라우저 API 사용 시
- 단일 책임 원칙
- `any` 금지

### 2. 디자인 시스템
- 다크모드 기본 — 게이머 친화적 UI
- 게임 데이터 시각화에 최적화 (레이더 차트로 성향 표현, 바 차트로 지표 비교)
- shadcn/ui 기반 — Card, Badge, Progress, Tabs 적극 활용
- 성향 색상 코딩: 공격형(붉은 계열), 생존형(녹색 계열), 균형형(파란 계열)
- 반응형 — 모바일 1열, 태블릿 2열, 데스크톱 3+열

### 3. 사용자 경험 (PUBG 분석 특화)
- **검색 UX** — 닉네임 입력 → 플랫폼 선택(Steam/Kakao) → 즉시 검색
- **로딩 상태** — 매치 수집/분석은 수 초~수십 초 소요. Skeleton + 진행 표시 필수
- **빈 상태** — 첫 검색 / 데이터 없음 가이드 카드
- **에러 상태** — 플레이어 없음, API 오류 명확한 메시지 + 재시도
- **데이터 신선도** — "5분 전 분석" 등 분석 시점 표시
- **숫자 포맷** — K/D (소수점 2자리), 데미지 (정수), 킬 (정수), 생존시간 (mm:ss)

### 4. 주요 화면 구성

```
/                          # 홈 — 닉네임 검색
/player/[name]             # 플레이어 프로필 + 최근 매치 목록
/player/[name]/analysis    # 플레이 스타일 분석 대시보드
  ├─ 성향 레이더 차트 (공격성/생존/포지셔닝/팀플)
  ├─ 핵심 지표 카드 (K/D, 평균 데미지, 생존시간, 헤드샷율)
  ├─ 매치별 성향 트렌드 차트
  └─ LLM 성향 요약 텍스트 (Claude)
```

### 5. API 연동
- `packages/shared`의 Zod 스키마를 FE/BE에서 함께 import
- 에러 응답 처리 (404→플레이어 없음 안내, 202→분석 진행 중, 500→재시도)
- 분석 결과 polling 또는 SSE 구독

### 6. 보안
- API 키/시크릿 클라이언트 노출 금지 — `NEXT_PUBLIC_` 외에는 서버에서만 사용
- `dangerouslySetInnerHTML` 사용 시 sanitize 필수

## 프로젝트 구조 (예시)

```
apps/web/
├── app/
│   ├── page.tsx                    # 홈 (검색)
│   ├── player/
│   │   └── [name]/
│   │       ├── page.tsx            # 플레이어 프로필
│   │       └── analysis/
│   │           └── page.tsx        # 분석 대시보드
│   └── api/                        # Route Handlers (BFF)
├── components/
│   ├── ui/                         # shadcn/ui 기반 프리미티브
│   ├── player/                     # 플레이어 카드, 매치 목록
│   └── analysis/                   # 레이더 차트, 지표 카드, 트렌드
├── lib/
│   ├── api/                        # BE API 클라이언트 (Zod 검증)
│   └── format/                     # 숫자/날짜 포맷터
└── tailwind.config.ts
```

## 코드 작성 규칙
- 기존 패턴 먼저 파악 후 따른다
- 과도한 추상화 회피
- 서버/클라이언트 컴포넌트 경계 의식적으로 설계
