# T-019 PRD — 공유 기능 (신규 기능)

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

플레이어 분석 결과를 링크 또는 이미지로 공유할 수 있는 기능을 구현한다.
디스코드/카카오/X(트위터)에 붙여넣기 좋은 형태로 제공한다.

## 공유 방식

### 1. 링크 공유
- URL 자체가 플레이어 ID를 포함하므로 바로 공유 가능
- "링크 복사" 버튼 → 클립보드에 복사
- OG(Open Graph) 메타태그로 링크 미리보기 지원

**OG 메타태그 (Next.js generateMetadata)**
```typescript
// /players/[pubgId]/page.tsx
export async function generateMetadata({ params }) {
  const player = await getPlayer(params.pubgId)
  const analysis = await getAnalysis(params.pubgId)
  return {
    title: `${player.nickname}의 PUBG 플레이 스타일 — Risker 분석`,
    description: `공격성 ${analysis.aggression}/100 · 생존형 ${analysis.survival}/100 · ${analysis.styleLabel}`,
    openGraph: {
      title: `${player.nickname}의 배그 DNA`,
      description: analysis.llmSummary?.slice(0, 100) + '...',
      images: [`/api/og?playerId=${params.pubgId}`],
    }
  }
}
```

### 2. OG 이미지 동적 생성
- `GET /api/og?playerId={pubgId}` — 동적 OG 이미지 생성
- Next.js `@vercel/og` (ImageResponse) 사용
- 이미지 내용:
  ```
  [배경: 다크 + 포인트 컬러]
  [닉네임 대형 텍스트]
  [4대 성향 점수 바]
  [성향 레이블]
  [Risker 로고]
  ```
- 크기: 1200x630 (OG 표준)
- 캐시: `Cache-Control: public, max-age=3600`

### 3. 이미지로 저장 (PNG 다운로드)
- 분석 대시보드 카드를 `html2canvas`로 캡처
- "이미지로 저장" 버튼 클릭 → PNG 다운로드
- 파일명: `{nickname}-pubg-analysis.png`

## UI

### 공유 버튼 (분석 대시보드 + 프로필 헤더)
```
[🔗 링크 복사]  [📷 이미지 저장]
```
- 링크 복사 성공 시: "복사됨!" 토스트 (2초)

### 디스코드 미리보기 예시
```
Risker PUBG Analyzer
PlayerName의 배그 DNA
공격성 72 · 생존형 38 · 포지셔닝 61 · 팀플 55
[러셔 (Rusher)] 교전을 즐기며 공격적으로 킬을 추구합니다
pubg.risker.co.kr/players/...
```

## 완료 조건

- [ ] "링크 복사" 버튼 + 클립보드 API
- [ ] OG 메타태그 동적 생성 (generateMetadata)
- [ ] `/api/og` 엔드포인트 (동적 OG 이미지, 1200x630)
- [ ] "이미지로 저장" (html2canvas PNG 다운로드)
- [ ] 디스코드/카카오/X 링크 미리보기 확인

## 의존성

- T-010 (분석 대시보드)
- T-009 (플레이어 프로필)
- T-011 (LLM 요약 — OG 이미지/메타태그에 활용)
