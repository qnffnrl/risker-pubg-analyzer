# T-000 PRD — 디자인 시스템 & 글로벌 레이아웃

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: design/infra

## 목표

전체 앱에 일관된 디자인 시스템과 반응형 레이아웃을 구축한다.
openclaw.ai 수준의 다크테마 기반 고급스러운 UI로, 모바일~데스크톱 모든 환경에서 동작한다.

## 배경

모든 Phase의 UI 작업(T-008~013, T-015~020)의 기반이 되는 공통 컴포넌트/토큰/레이아웃.
먼저 확립하지 않으면 각 태스크마다 디자인이 파편화된다.

## 레퍼런스

- https://openclaw.ai/ — 다크 배경, 그라데이션 포인트, 미니멀한 카드 UI, 타이포그래피 강조
- 배그 특성상 군사적·전술적 분위기 → 다크 그린/사이언 포인트 컬러 활용

## 디자인 방향

### 컬러 팔레트
```
배경: #0a0f14 (거의 검정)
카드: #111820 (진회색)
테두리: #1e2a35
포인트: #00d4aa (사이언/민트 — "전술 레이더" 느낌)
포인트2: #f59e0b (앰버 — 킬/공격성 지표)
텍스트 주: #e2e8f0
텍스트 보조: #64748b
```

### 타이포그래피
- 폰트: `Inter` (영문) + `Noto Sans KR` (한글)
- 헤딩: 굵은 weight, 레터스페이싱 tight
- 숫자/지표: `font-variant-numeric: tabular-nums`

### 컴포넌트 (shadcn/ui 커스터마이징)
- `<Card>` — 다크 배경 + 얇은 테두리 + 미세 glow
- `<Badge>` — 포인트 컬러 변형 (공격성/생존/포지셔닝/팀플)
- `<StatCard>` — 지표 이름 + 수치 + 비교 증감 표시
- `<RadarChart>` — 플레이 스타일 4축 레이더 (recharts)
- `<Skeleton>` — 로딩 플레이스홀더
- `<Button>` — primary (사이언) / ghost / destructive
- `<Input>` — 검색용 다크 인풋, 포커스 glow 효과
- `<Avatar>` — 플레이어 아이콘 (이니셜 or PUBG 계정 이미지)

### 레이아웃
```
모바일(~768px): 단일 컬럼, 하단 네비
태블릿(768~1024px): 2컬럼 그리드
데스크톱(1024px+): 사이드바 + 메인 컨텐츠
```

### 글로벌 레이아웃 컴포넌트
- `<AppShell>` — 공통 래퍼 (헤더 + 사이드바 + 메인)
- `<Header>` — 로고 + 검색바 + 모바일 햄버거
- `<Sidebar>` — 즐겨찾기 플레이어 목록 + 최근 검색 (데스크톱)
- `<BottomNav>` — 모바일 하단 탭 (홈/검색/비교/관리자)
- `<PageWrapper>` — 페이지별 패딩/maxWidth 통일
- `<ErrorBoundary>` — 전역 에러 핸들링 UI

### Base Path
- 서브도메인(`pubg.risker.co.kr`) 운영 — Next.js `basePath` 불필요
- 앱이 루트(`/`)에서 서비스됨

## 기술 스펙

| 항목 | 내용 |
|------|------|
| 스타일링 | TailwindCSS v3 + CSS Variables |
| 컴포넌트 | shadcn/ui (커스텀 테마 적용) |
| 차트 | recharts |
| 아이콘 | lucide-react |
| 애니메이션 | Framer Motion (진입 애니메이션) |
| 반응형 | Tailwind breakpoints (sm/md/lg/xl) |

## 파일 구조

```
apps/web/
  src/
    components/
      ui/           # shadcn/ui 기본 컴포넌트 (커스텀)
      layout/
        AppShell.tsx
        Header.tsx
        Sidebar.tsx
        BottomNav.tsx
        PageWrapper.tsx
      charts/
        RadarChart.tsx
        LineChart.tsx
        BarChart.tsx
      shared/
        StatCard.tsx
        PlayerAvatar.tsx
        LoadingSkeleton.tsx
    styles/
      globals.css   # CSS 변수 + Tailwind 설정
    lib/
      utils.ts      # cn() 등 유틸
```

## 완료 조건

- [ ] `globals.css`에 CSS 변수(컬러/타이포) 정의 완료
- [ ] `tailwind.config.ts` 커스텀 테마 적용
- [ ] shadcn/ui 초기화 + 다크 테마 커스터마이징
- [ ] AppShell / Header / Sidebar / BottomNav 컴포넌트 구현
- [ ] StatCard / RadarChart / Skeleton 공통 컴포넌트 구현
- [ ] 모바일(375px) / 태블릿(768px) / 데스크톱(1440px) 레이아웃 검증
- [ ] `pubg.risker.co.kr` 서브도메인 루트(`/`) 서비스 확인
- [ ] Storybook 불필요 — 실제 페이지에서 통합 확인

## 의존성

- T-001 (모노레포 스캐폴딩) 완료 후 작업 시작
- 모든 FE 태스크(T-008~013, T-015~020)가 이 디자인 시스템을 사용
