# T-003 PRD — 앱 컨테이너화 (Dockerfile + docker-compose)

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: infra

## 목표

각 앱(web, api, worker)을 프로덕션 수준의 Docker 이미지로 빌드하고,
로컬 개발과 프로덕션 배포 모두에서 동작하는 docker-compose 구성을 완성한다.

## 범위

### Dockerfile (각 앱별)

**apps/web/Dockerfile**
- `node:20-alpine` 기반
- Next.js `output: 'standalone'` 활용한 경량 이미지
- 멀티스테이지: deps → builder → runner
- 비root 유저 실행

**apps/api/Dockerfile**
- `node:20-alpine` 기반
- 멀티스테이지: deps → builder → runner
- `dist/` 번들 복사
- 포트 `3001` EXPOSE

**apps/worker/Dockerfile**
- `node:20-alpine` 기반
- 멀티스테이지: deps → builder → runner
- BullMQ Worker 프로세스

### docker-compose.yml (로컬 개발)

```yaml
services:
  postgres:   # 기존 (port 5432)
  redis:      # 기존 (port 6379)
  web:        # port 3000, dev 모드 (볼륨 마운트)
  api:        # port 3001, dev 모드
  worker:     # dev 모드
```

### docker-compose.prod.yml (프로덕션)

```yaml
services:
  postgres:   # named volume, 외부 포트 미노출
  redis:      # named volume, 외부 포트 미노출
  web:        # port 3000, standalone 이미지
  api:        # port 3001, 빌드 이미지
  worker:     # 빌드 이미지
  nginx:      # 리버스 프록시 (선택, T-014에서 결정)
```

### .dockerignore (각 앱)
- `node_modules/`, `.next/`, `dist/`, `.env*` 제외

### 환경 변수 관리
- `.env.example` → 실제 배포 시 `.env.prod` (git 제외)
- docker-compose에서 `env_file` 참조

## 완료 조건

- [ ] `docker build` — 3개 앱 이미지 빌드 성공
- [ ] `docker-compose up` — 5개 컨테이너(postgres, redis, web, api, worker) 정상 기동
- [ ] `http://localhost:3000/risker-pubg-analyzer` — web 접속 확인
- [ ] `http://localhost:3001/health` — api 헬스체크 통과
- [ ] worker 컨테이너 — Redis BullMQ 연결 로그 확인
- [ ] 이미지 크기: web < 500MB, api/worker < 300MB
- [ ] `docker-compose.prod.yml` 작성 완료

## 의존성

- T-001 (모노레포 스캐폴딩)
- T-002 (DB 스키마 — 마이그레이션 자동 실행 init 컨테이너 포함)
