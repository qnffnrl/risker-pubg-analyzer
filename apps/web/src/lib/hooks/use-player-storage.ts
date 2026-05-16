'use client'
import { useRecentSearches } from './use-recent-searches'
import { useFavorites } from './use-favorites'

export function usePlayerStorage() {
  const { searches: recentSearches, addSearch: addRecentSearch } = useRecentSearches()
  const { favorites, isFavorite, toggleFavorite } = useFavorites()

  return { recentSearches, favorites, isFavorite, toggleFavorite, addRecentSearch }
}
