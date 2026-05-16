# T-011 PRD — LLM 성향 자연어 요약 (Claude API)

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

플레이어의 분석 지표를 Claude API에 전달해 자연어로 개성 있는 플레이 스타일 요약을 생성한다.

## 요약 생성 시점

- 분석 엔진(T-006) 실행 완료 직후 Worker에서 자동 생성
- 프롬프트 캐싱으로 비용 절감 (시스템 프롬프트 캐시)
- 생성 실패 시 LLM 요약 없이 기본 분석 결과만 제공 (graceful degradation)

## 프롬프트 설계

### System Prompt (캐시 고정)
```
당신은 PUBG(배틀그라운드) 전문 분석가입니다.
플레이어의 통계 데이터를 바탕으로 플레이 스타일을 
재미있고 인상적으로 분석해주세요.

규칙:
- 300자 이내로 간결하게
- 한국어로 작성
- 배그 용어를 자연스럽게 사용 (존버, 러시, 치킨 등)
- 강점과 개선점을 함께 언급
- 너무 딱딱하지 않게, 약간의 유머 포함
```

### User Prompt (동적)
```typescript
`플레이어 "${nickname}"의 최근 ${matchCount}게임 분석 결과입니다:

공격성 점수: ${aggression}/100
- 평균 킬: ${avgKills}, 평균 데미지: ${avgDamage}, 헤드샷율: ${headshotRate}%

생존형 점수: ${survival}/100  
- 평균 생존시간: ${avgSurvivalTime}, 탑10율: ${top10Rate}%, 승률: ${winRate}%

포지셔닝 점수: ${positioning}/100
- 도보 이동: ${avgWalkDist}m, 차량 이용율: ${vehicleRate}%

팀플레이 점수: ${teamplay}/100
- 평균 부활: ${avgRevives}회, 평균 어시스트: ${avgAssists}회

선호 무기: ${topWeapons.join(', ')}
성향 레이블: ${styleLabel}

위 데이터를 바탕으로 이 플레이어의 스타일을 분석해주세요.`
```

## Claude API 설정

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const response = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',  // 비용 효율적
  max_tokens: 500,
  system: [
    {
      type: 'text',
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' }  // 프롬프트 캐싱
    }
  ],
  messages: [{ role: 'user', content: userPrompt }]
})
```

## 비용 관리

- 모델: `claude-haiku-4-5-20251001` (가장 저렴)
- 프롬프트 캐싱 적용 (시스템 프롬프트 캐시)
- 생성된 요약은 `play_style_analyses.llm_summary`에 캐시
- 24시간 캐시 TTL 내 재요청 시 재생성 안 함

## 완료 조건

- [ ] Claude API 연동 + 자연어 요약 생성
- [ ] 프롬프트 캐싱 적용 확인 (cache_creation_input_tokens > 0)
- [ ] `play_style_analyses.llm_summary` 저장
- [ ] LLM 실패 시 graceful degradation (요약 없이 분석 결과 반환)
- [ ] 대시보드(T-010)에 요약 텍스트 표시
- [ ] 환경 변수 `ANTHROPIC_API_KEY` 누락 시 기능 비활성화

## 의존성

- T-006 (분석 엔진 — 지표 데이터)
- T-010 (대시보드 — 표시 영역)
- Anthropic API 키 (`ANTHROPIC_API_KEY`)
