import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Entity } from '@shared/schema';

/**
 * Props for the SearchResultsPanel component.
 */
export interface SearchResultsPanelProps {
  /** Entities matching the current search query */
  matchingEntities: Entity[];
  /** Current search query string */
  searchQuery: string;
  /** Callback when an entity result is clicked to center on it */
  onCenterOnEntity: (entityId: string) => void;
}

/**
 * Floating panel that displays search results and allows quick navigation
 * to matching entities on the canvas.
 *
 * @param {SearchResultsPanelProps} props - Component props
 * @returns {JSX.Element | null}
 */
export function SearchResultsPanel({
  matchingEntities,
  searchQuery,
  onCenterOnEntity,
}: SearchResultsPanelProps) {
  if (matchingEntities.length === 0 || !searchQuery) {
    return null;
  }

  return (
    <div
      className="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-3 w-80 z-10"
      data-testid="search-results-panel"
    >
      <div className="text-sm font-semibold mb-2 text-gray-600">
        Found {matchingEntities.length} {matchingEntities.length === 1 ? 'entity' : 'entities'}
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {matchingEntities.map((entity) => (
          <div
            key={entity.id}
            className="p-2 hover:bg-gray-50 rounded cursor-pointer flex items-center justify-between"
            onClick={() => onCenterOnEntity(entity.id)}
            data-testid={`search-result-${entity.id}`}
          >
            <div>
              <div className="font-medium text-sm text-gray-600">{entity.name}</div>
              <div className="text-xs text-gray-500">{entity.dataSource || 'No source'}</div>
            </div>
            <Button variant="ghost">
              <Target className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
