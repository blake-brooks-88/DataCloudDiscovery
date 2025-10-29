import { memo } from 'react';
import { Toolbar } from '@/features/projects';
import { GraphView, ListView, useSearchState } from '@/features/entities';
import type { ViewMode } from '@/features/entities';
import type { Project, Entity } from '@shared/schema';

interface ProjectViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentProject: Project;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntityPosition: (id: string, position: { x: number; y: number }) => void;
  onEntityDoubleClick: (entity: Entity) => void;
  onGenerateDLO: (entity: Entity) => void;
  onGenerateDMO: (entity: Entity) => void;
  onOpenDataSources: () => void;
  onOpenRelationships: () => void;
}

/**
 * Isolated component that manages search state independently from Home.
 * This prevents Home (and Navbar) from re-rendering when search query changes.
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
  // Search state is isolated here - changes don't bubble up to Home
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
            onUpdateRelationshipWaypoints={() => {
              // TODO: Implement waypoint persistence
            }}
          />
        )}

        {viewMode === 'table' && (
          <ListView entities={currentProject.entities || []} onEntityClick={onSelectEntity} />
        )}
      </div>
    </>
  );
}

export const ProjectView = memo(ProjectViewComponent);
