# T-002 PRD — DB 스키마 설계

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: infra

## 목표

PostgreSQL 스키마를 Drizzle ORM으로 정의하고 마이그레이션을 구성한다.
플레이어 캐시, 매치 데이터, 분석 결과, 트래픽 로그를 저장한다.

## 테이블 설계

### `players`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
pubg_id       varchar(64) UNIQUE NOT NULL  -- PUBG API accountId
nickname      varchar(64) NOT NULL
platform      varchar(16) NOT NULL  -- steam / kakao / console
region        varchar(16)           -- as-sea 등
last_fetched_at timestamptz
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### `matches`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
pubg_match_id varchar(128) UNIQUE NOT NULL
map_name      varchar(64)
mode          varchar(32)   -- squad / duo / solo / squad-fpp 등
played_at     timestamptz
duration_sec  integer
total_players integer
raw_data      jsonb         -- PUBG API 원본 응답 (전체 매치)
created_at    timestamptz DEFAULT now()
```

### `player_match_stats`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
player_id     uuid REFERENCES players(id)
match_id      uuid REFERENCES matches(id)
placement     integer
kills         integer
assists       integer
damage_dealt  numeric(8,2)
headshot_kills integer
distance_on_foot numeric(10,2)
distance_in_vehicle numeric(10,2)
time_survived  integer   -- seconds
boosts        integer
heals         integer
weapons_acquired integer
revives       integer
team_kills    integer
raw_stats     jsonb      -- 파싱 전 원본
created_at    timestamptz DEFAULT now()
UNIQUE(player_id, match_id)
```

### `play_style_analyses`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
player_id     uuid REFERENCES players(id)
analyzed_at   timestamptz DEFAULT now()
match_count   integer      -- 분석에 사용된 매치 수
-- 4대 성향 점수 (0.0 ~ 100.0)
aggression_score  numeric(5,2)
survival_score    numeric(5,2)
positioning_score numeric(5,2)
teamplay_score    numeric(5,2)
-- 세부 지표 (jsonb)
aggression_metrics  jsonb  -- avg_kills, avg_damage, headshot_rate, etc.
survival_metrics    jsonb  -- avg_survival_time, avg_boosts, etc.
positioning_metrics jsonb  -- avg_walk_dist, vehicle_rate, landing_zone, etc.
teamplay_metrics    jsonb  -- avg_revives, avg_assists, etc.
-- 무기 분석
weapon_preferences  jsonb  -- [{weapon, kills, damage, headshot_rate}]
-- 맵 분석
map_preferences     jsonb  -- [{map, count, avg_placement}]
-- LLM 요약
llm_summary         text
llm_generated_at    timestamptz
-- 캐시 만료
expires_at    timestamptz   -- 기본 24시간
```

### `analysis_jobs`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
player_id     uuid REFERENCES players(id)
status        varchar(16)   -- pending / processing / completed / failed
bull_job_id   varchar(128)
error_message text
started_at    timestamptz
completed_at  timestamptz
created_at    timestamptz DEFAULT now()
```

### `traffic_logs`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
path          varchar(256)
method        varchar(8)
status_code   integer
ip_address    varchar(64)
user_agent    text
duration_ms   integer
searched_player varchar(64)  -- 검색된 플레이어명 (있는 경우)
created_at    timestamptz DEFAULT now()
```

## 인덱스

```sql
-- 자주 조회되는 컬럼
CREATE INDEX idx_players_nickname ON players(nickname);
CREATE INDEX idx_players_pubg_id ON players(pubg_id);
CREATE INDEX idx_player_match_stats_player_id ON player_match_stats(player_id);
CREATE INDEX idx_play_style_analyses_player_id ON play_style_analyses(player_id);
CREATE INDEX idx_play_style_analyses_expires_at ON play_style_analyses(expires_at);
CREATE INDEX idx_traffic_logs_created_at ON traffic_logs(created_at);
CREATE INDEX idx_traffic_logs_path ON traffic_logs(path);
```

## Drizzle 구성

```
packages/db/
  src/
    schema/
      players.ts
      matches.ts
      playerMatchStats.ts
      playStyleAnalyses.ts
      analysisJobs.ts
      trafficLogs.ts
    index.ts         # drizzle 클라이언트 export
  drizzle.config.ts
  migrations/        # drizzle-kit 생성 마이그레이션
```

## 완료 조건

- [ ] 모든 테이블 Drizzle 스키마로 정의
- [ ] `drizzle-kit generate` — 마이그레이션 파일 생성
- [ ] `drizzle-kit migrate` — Docker PostgreSQL에 적용 성공
- [ ] `packages/db`에서 Drizzle 클라이언트 import → 타입 추론 동작
- [ ] 시드 데이터 없음 (실제 PUBG API 데이터 사용)

## 의존성

- T-001 (모노레포 스캐폴딩)
