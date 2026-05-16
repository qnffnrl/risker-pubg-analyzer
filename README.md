# Risker PUBG Analyzer

PUBG 플레이 스타일 분석 웹앱. 닉네임 검색 → 매치 수집 → 공격성·생존·포지셔닝·팀플 4대 성향 분석.

**URL**: https://pubg.risker.co.kr

## 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 14 (App Router) + TailwindCSS |
| Backend | Hono + Drizzle ORM |
| Worker | BullMQ + PUBG API |
| DB | PostgreSQL + Redis |
| 배포 | Docker Compose + Caddy |

## 로컬 개발

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 편집 (PUBG_API_KEY 등)

# Docker 실행
docker compose -f docker-compose.prod.yml --env-file .env.local up -d --build
```

## 배포 (자동)

`main` 브랜치에 push하면 GitHub Actions가 자동으로 `risker.co.kr` 서버에 배포합니다.

### GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions 에서 아래 항목 등록:

| Secret | 설명 |
|--------|------|
| `SERVER_HOST` | 서버 호스트 (`risker.co.kr`) |
| `SERVER_USER` | SSH 접속 유저명 |
| `SERVER_SSH_KEY` | SSH 개인키 (PEM 형식) |

> `PUBG_API_KEY`는 서버의 `/opt/risker-pubg-analyzer/.env.prod`에 직접 설정 (Secrets 불필요)

### 서버 초기 세팅 (최초 1회)

```bash
# 서버 접속 (SSH 포트 2222)
ssh -p 2222 user@risker.co.kr

# 코드 클론
git clone https://github.com/<org>/risker-pubg-analyzer /opt/risker-pubg-analyzer
cd /opt/risker-pubg-analyzer

# .env.prod 생성
cp .env.prod.example .env.prod
# 편집: PUBG_API_KEY, DB_PASSWORD 등 실제 값 입력

# Caddy 설정 추가 (기존 Caddyfile에 추가)
# pubg.risker.co.kr {
#     handle /api/* { reverse_proxy localhost:8081 }
#     handle { reverse_proxy localhost:8080 }
# }

# 초기 실행
docker compose -f docker-compose.prod.yml up -d --build
```

## 롤백

### 방법 1 — 이전 커밋으로 되돌리기

```bash
# 서버에서 실행
cd /opt/risker-pubg-analyzer
git log --oneline -10          # 되돌릴 커밋 해시 확인
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

### 방법 2 — GitHub에서 Revert PR 생성

GitHub Actions가 자동으로 재배포.

### 방법 3 — 컨테이너 재시작만 필요한 경우

```bash
docker compose -f docker-compose.prod.yml restart web
docker compose -f docker-compose.prod.yml restart api
```
