import { memo } from 'react';
import { Toolbar } from '@/features/projects';
// FIX: Changed barrel imports to direct imports to resolve the type ambiguity error,
// ensuring GraphView is correctly identified with its specific props.
import GraphView from '@/features/entities/components/GraphView';
import ListView from '@/features/entities/components/ListView';
import { useSearchState } from '@/features/entities/hooks/useSearchState';

import type { ViewMode } from '@/features/entities';
import type { Project, Entity } from '@shared/schema';
// Removed: DndProvider, HTML5Backend imports
// Removed: import { DraggingEntityLayer } from '@/features/entities/components/DraggingEntityLayer'; // <-- OLD DND COMPONENT

interface ProjectViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentProject: Project;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  // NOTE: onUpdateEntityPosition is now passed through to GraphView, which handles persistence
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
  // Manages the search input state for filtering entities
  const { searchQuery, setSearchQuery } = useSearchState();

  // NOTE: viewportState and handleViewportChange are now obsolete
  // because GraphView is self-contained via React Flow context and useViewport hook.
  // They are left commented for now in case an external component needs this state later.
  // const [viewportState, setViewportState] = useState({ zoom: 1, panOffset: { x: 0, y: 0 } });
  // const handleViewportChange = useCallback((zoom: number, panOffset: { x: number; y: number }) => {
  //     setViewportState({ zoom, panOffset });
  // }, []);

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
        {/* REMOVED: DndProvider and HTML5Backend wrapper - now obsolete with React Flow */}
        {/* REMOVED: <DndProvider backend={HTML5Backend}> */}

        {/* REMOVED: DraggingEntityLayer - was only necessary for DndProvider. */}
        {/* <DraggingEntityLayer
                        entities={currentProject.entities || []}
                        zoom={viewportState.zoom}
                    /> */}

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
            // REMOVED: onViewportChange - GraphView is now self-contained
            // REMOVED: onUpdateRelationshipWaypoints is not strictly needed here if handled in GraphView or relationship feature
          />
        )}
        {/* REMOVED: </DndProvider> */}

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
