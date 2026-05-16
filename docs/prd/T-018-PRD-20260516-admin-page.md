# T-018 PRD — 관리자 페이지 (트래픽 모니터링 + 접근 제한)

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

앱 트래픽과 사용 현황을 볼 수 있는 관리자 대시보드를 구현한다.
단일 비밀번호로 접근을 제한하며, 로그인 없는 간단한 인증 방식을 사용한다.

## 접근 제어

### 인증 방식
- 비밀번호 단독 인증 (아이디 없음)
- 비밀번호: 환경 변수 `ADMIN_PASSWORD`로 관리
- 세션: 브라우저 `sessionStorage`에 토큰 저장 (탭 닫으면 로그아웃)
- 토큰: `HMAC-SHA256(password + date)` — 서버에서 검증

### 인증 플로우
```
/risker-pubg-analyzer/admin 접속
  → 비밀번호 입력 화면
  → POST /api/v1/admin/auth { password }
  → 성공: sessionStorage에 토큰 저장 + 대시보드로 이동
  → 실패: 오류 메시지 (3회 실패 시 1분 잠금)
```

### API 보호
- 모든 `/api/v1/admin/*` 엔드포인트: `Authorization: Bearer {token}` 헤더 필요
- 미들웨어에서 토큰 검증

## 관리자 대시보드 UI

### URL
`http://risker.co.kr/risker-pubg-analyzer/admin`

### 대시보드 구성

**상단 요약 카드 (실시간)**
```
[오늘 총 방문수]  [오늘 검색수]  [캐시 히트율]  [평균 응답시간]
```

**트래픽 라인 차트**
```
시간대별 요청 수 (최근 24시간, 1시간 단위)
```

**인기 검색 플레이어 Top 10**
```
1. PlayerName1  ████████████ 42회
2. PlayerName2  ████████ 28회
...
```

**경로별 요청 분포**
```
/players/search   ████████████ 58%
/players/{id}     ██████ 30%
/compare          ██ 7%
기타              █ 5%
```

**최근 요청 로그 테이블 (실시간, 최근 50개)**
```
시각          경로                  상태  응답시간  IP
14:32:05      /api/v1/players/...   200   128ms    123.456...
14:32:03      /api/v1/players/...   404   45ms     ...
```

**에러 현황**
```
[최근 24시간 4xx 에러]  [최근 24시간 5xx 에러]
```

**분석 큐 상태**
```
[대기 중 잡]  [처리 중 잡]  [오늘 완료]  [오늘 실패]
```

## API 엔드포인트 (관리자 전용)

```
POST /api/v1/admin/auth
→ { token: string }

GET  /api/v1/admin/stats/summary
→ { todayVisits, todaySearches, cacheHitRate, avgResponseMs }

GET  /api/v1/admin/stats/traffic?period=24h&granularity=1h
→ [{ timestamp, requestCount, errorCount }]

GET  /api/v1/admin/stats/popular-players?limit=10
→ [{ nickname, searchCount }]

GET  /api/v1/admin/logs?limit=50&offset=0
→ [TrafficLog]

GET  /api/v1/admin/queue/status
→ { waiting, active, completed, failed }

DELETE /api/v1/admin/cache/{playerId}
→ 특정 플레이어 캐시 강제 무효화
```

## 보안 주의사항

- 비밀번호는 절대 프론트엔드 코드에 하드코딩 금지
- `ADMIN_PASSWORD` 환경 변수 → 서버 사이드에서만 접근
- 토큰 만료: 세션 기반 (탭 닫으면 삭제)
- IP 로그는 마스킹 표시 (123.45x.xxx.xxx)
- Rate Limit: 어드민 로그인 API — IP당 5회/분

## 완료 조건

- [ ] 비밀번호 입력 페이지 (오류 처리 + 3회 잠금)
- [ ] JWT 토큰 생성/검증 미들웨어
- [ ] 요약 카드 (방문수, 검색수, 캐시 히트율)
- [ ] 시간대별 트래픽 라인 차트
- [ ] 인기 검색 플레이어 Top 10
- [ ] 실시간 요청 로그 테이블
- [ ] 큐 상태 표시
- [ ] `/admin/*` 경로 비인증 접근 차단 (미들웨어)
- [ ] 모바일에서도 접근 가능한 반응형 레이아웃

## 의존성

- T-000 (디자인 시스템)
- T-002 (DB 스키마 — traffic_logs 테이블)
- T-007 (API — 트래픽 로깅 미들웨어)
