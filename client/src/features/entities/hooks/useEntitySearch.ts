import { useMemo } from 'react';
import type { Entity } from '@shared/schema';

/**
 * Return type for the useEntitySearch hook.
 */
export interface UseEntitySearchReturn {
  /** Entities that match the current search query */
  matchingEntities: Entity[];
  /** Whether a search query is active */
  hasSearchQuery: boolean;
}

/**
 * Hook for filtering entities based on search query.
 * Performs case-insensitive substring matching on entity names.
 *
 * @param {Entity[]} entities - Array of all entities
 * @param {string} searchQuery - Current search query string
 * @returns {UseEntitySearchReturn}
 */
export function useEntitySearch(entities: Entity[], searchQuery: string): UseEntitySearchReturn {
  const matchingEntities = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const lowerQuery = searchQuery.toLowerCase();
    return entities.filter((entity) => entity.name.toLowerCase().includes(lowerQuery));
  }, [entities, searchQuery]);

  const hasSearchQuery = searchQuery.trim().length > 0;

  return {
    matchingEntities,
    hasSearchQuery,
  };
}
