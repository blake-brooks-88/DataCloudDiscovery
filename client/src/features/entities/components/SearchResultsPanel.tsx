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
      // FIX: Apply pointer-events-none to the container so that it doesn't block
      // clicks/drags on the canvas underneath.
      className="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-3 w-80 z-10 pointer-events-none"
      data-testid="search-results-panel"
    >
      {/* Use a wrapper that re-enables pointer events for its interactive children. */}
      <div className="space-y-1 max-h-64 overflow-y-auto pointer-events-auto">
        {matchingEntities.map((entity) => (
          <div
            key={entity.id}
            // The item itself is clickable, so it needs pointer-events-auto, but the parent already handled it
            className="p-2 hover:bg-coolgray-50 rounded cursor-pointer flex items-center justify-between"
            onClick={() => onCenterOnEntity(entity.id)}
            data-testid={`search-result-${entity.id}`}
          >
            <div>
              <div className="font-medium text-sm text-coolgray-600">{entity.name}</div>
              <div className="text-xs text-coolgray-500">{entity.dataSource || 'No source'}</div>
            </div>
            {/* Buttons are interactive by default, but ensuring they are not blocked */}
            <Button variant="ghost">
              <Target className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
