import { useState, useCallback } from 'react';

/**
 * Isolated hook for search functionality to prevent unnecessary parent re-renders.
 * Search state only affects Toolbar (input) and GraphView (filtering).
 *
 * @returns Search query state and setter
 */
export function useSearchState() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
  };
}
