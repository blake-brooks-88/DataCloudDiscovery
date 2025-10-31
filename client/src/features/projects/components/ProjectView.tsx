import { memo } from 'react';
import { Toolbar } from '@/features/projects';
import GraphView from '@/features/entities/components/GraphView';
import ListView from '@/features/entities/components/ListView';
import { useSearchState } from '@/features/entities/hooks/useSearchState';

import type { ViewMode } from '@/features/entities';
import type { ProjectDetail, Entity } from '@shared/schema';

interface ProjectViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentProject: ProjectDetail;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntityPosition: (id: string, position: { x: number; y: number }) => Promise<void>;
  onEntityDoubleClick: (entity: Entity) => void;
  onGenerateDLO: (entity: Entity) => void;
  onGenerateDMO: (entity: Entity) => void;
  onOpenDataSources: () => void;
  onOpenRelationships: () => void;
}

/**
 * @component ProjectViewComponent
 * @description Serves as the high-level container that switches between Graph and List views
 * and manages global view state (search query, viewport status).
 *
 * @param {ProjectViewProps} props - Component props
 * @returns {JSX.Element}
 */
function ProjectViewComponent({
  viewMode,
  onViewModeChange,
  currentProject,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntityPosition,
  onEntityDoubleClick,
  onGenerateDLO,
  onGenerateDMO,
  onOpenDataSources,
  onOpenRelationships,
}: ProjectViewProps) {
  const { searchQuery, setSearchQuery } = useSearchState();

  return (
    <>
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenDataSources={onOpenDataSources}
        onOpenRelationships={onOpenRelationships}
      />

      <div className="flex-1 overflow-hidden">
        {viewMode === 'graph' && (
          <GraphView
            entities={currentProject.entities || []}
            relationships={currentProject.relationships || []}
            selectedEntityId={selectedEntityId}
            searchQuery={searchQuery}
            onSelectEntity={onSelectEntity}
            onUpdateEntityPosition={onUpdateEntityPosition}
            onEntityDoubleClick={onEntityDoubleClick}
            onGenerateDLO={onGenerateDLO}
            onGenerateDMO={onGenerateDMO}
          />
        )}

        {viewMode === 'table' && (
          <ListView entities={currentProject.entities || []} onEntityClick={onSelectEntity} />
        )}
      </div>
    </>
  );
}

/**
 * @exports ProjectView
 * @description Memoized Project View component for rendering performance.
 */
export const ProjectView = memo(ProjectViewComponent);
