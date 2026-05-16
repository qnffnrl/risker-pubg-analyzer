# T-012 PRD — 로컬 스토리지 (최근 검색 + 즐겨찾기)

> 상태: 📋 대기 | 생성일: 2026-05-16 | 유형: feat

## 목표

로그인 없이 브라우저 로컬 스토리지로 최근 검색 + 즐겨찾기 플레이어를 관리한다.
서버 의존 없이 빠른 재접근을 제공한다.

## 데이터 구조

```typescript
// localStorage key: 'risker:recent-searches'
type RecentSearch = {
  pubgId: string
  nickname: string
  platform: 'steam' | 'kakao' | 'console'
  searchedAt: string   // ISO timestamp
  avatarColor: string  // 닉네임 기반 생성 컬러 (#RRGGBB)
}
// 최대 10개, 초과 시 가장 오래된 항목 삭제
// 동일 pubgId 재검색 시 searchedAt 갱신 + 상단으로 이동

// localStorage key: 'risker:favorites'
type Favorite = {
  pubgId: string
  nickname: string
  platform: string
  addedAt: string
  avatarColor: string
}
// 최대 20개
```

## 커스텀 훅

### `useRecentSearches()`
```typescript
const {
  searches,           // RecentSearch[]
  addSearch,          // (player) => void
  removeSearch,       // (pubgId) => void
  clearAll,           // () => void
} = useRecentSearches()
```

### `useFavorites()`
```typescript
const {
  favorites,          // Favorite[]
  addFavorite,        // (player) => void
  removeFavorite,     // (pubgId) => void
  isFavorite,         // (pubgId) => boolean
  toggleFavorite,     // (player) => void
} = useFavorites()
```

### `usePlayerStorage()`
```typescript
// 두 훅 통합 — 가장 많이 사용될 복합 훅
const {
  recentSearches,
  favorites,
  isFavorite,
  toggleFavorite,
  addRecentSearch,
} = usePlayerStorage()
```

## Avatar 컬러 생성

닉네임 해시 기반으로 일관된 컬러 생성:
```typescript
function getAvatarColor(nickname: string): string {
  const COLORS = ['#00d4aa', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', ...]
  const hash = nickname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}
```

## UI 컴포넌트

### `<RecentSearchList />` (홈 페이지 사용)
```
[Avatar] [닉네임] [플랫폼]    [검색 시각]
                               [삭제 X]
```

### `<FavoriteList />` (사이드바 + 홈 페이지)
```
[Avatar] [닉네임] [플랫폼]
         [마지막 분석 날짜]
[★ 즐겨찾기 해제]
```

### `<FavoriteButton />` (플레이어 프로필에서 사용)
```
★ 즐겨찾기  ↔  ☆ 즐겨찾기 해제
```

## SSR 호환

Next.js App Router 환경에서 `window` 접근:
```typescript
// localStorage는 클라이언트에서만 동작
// "use client" 컴포넌트 or useEffect 내부에서만 접근
// SSR hydration mismatch 방지: mounted 상태 확인 후 렌더
```

## 완료 조건

- [ ] `useRecentSearches` 훅 구현 (CRUD + 최대 10개)
- [ ] `useFavorites` 훅 구현 (CRUD + 최대 20개)
- [ ] 닉네임 기반 Avatar 컬러 생성 함수
- [ ] `<RecentSearchList />` + `<FavoriteList />` 컴포넌트
- [ ] `<FavoriteButton />` 컴포넌트
- [ ] SSR hydration mismatch 없음
- [ ] 다른 탭에서 변경 시 `storage` 이벤트로 동기화

## 의존성

- T-000 (디자인 시스템)
- T-008 (검색 페이지에서 사용)
- T-009 (프로필 페이지에서 사용)
