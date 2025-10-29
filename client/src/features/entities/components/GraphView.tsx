import { useRef, useCallback, useMemo } from 'react';
import type { Entity, Relationship } from '@shared/schema';
// Adding explicit file extensions to internal feature imports to resolve bundler resolution issues.
import {
  EntityNode,
  ViewportControls,
  SearchResultsPanel,
  CanvasLegend,
  RelationshipLayer,
  useCanvasViewport,
  useEntityDrag,
  useEntitySearch,
} from '@/features/entities';
/**
 * Props for the GraphView component.
 * Handlers accept the full Entity object to simplify data flow from parent components.
 */
export interface GraphViewProps {
  entities: Entity[];
  relationships?: Relationship[];
  selectedEntityId: string | null;
  searchQuery?: string;
  onSelectEntity: (entityId: string | null) => void;
  onUpdateEntityPosition: (entityId: string, position: { x: number; y: number }) => void;
  onEntityDoubleClick: (entity: Entity) => void;
  onGenerateDLO?: (entity: Entity) => void;
  onGenerateDMO?: (entity: Entity) => void;
  onUpdateRelationshipWaypoints: (
    entityId: string,
    fieldId: string,
    waypoints: { x: number; y: number }[]
  ) => void;
}

/**
 * Optimized interactive canvas for entity relationship diagrams.
 * Uses local state during drag operations for smooth 60fps performance.
 *
 * @param {GraphViewProps} props - Component props
 * @returns {JSX.Element}
 */
export default function GraphView({
  entities,
  relationships = [],
  selectedEntityId,
  searchQuery = '',
  onSelectEntity,
  onUpdateEntityPosition,
  onEntityDoubleClick,
  onGenerateDLO,
  onGenerateDMO,
  onUpdateRelationshipWaypoints,
}: GraphViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const viewport = useCanvasViewport(canvasRef, entities);
  const drag = useEntityDrag(canvasRef, entities, onUpdateEntityPosition);
  const search = useEntitySearch(entities, searchQuery);

  // Apply optimistic drag position override for smooth dragging during a drag operation.
  // The local position is applied here, creating the smooth-moving ghost node.
  const entitiesWithDragOverride = useMemo(() => {
    if (!drag.draggedEntityPosition) {
      return entities;
    }

    return entities.map((entity) =>
      entity.id === drag.draggedEntityPosition?.entityId
        ? {
            ...entity,
            position: {
              x: drag.draggedEntityPosition.x,
              y: drag.draggedEntityPosition.y,
            },
          }
        : entity
    );
  }, [entities, drag.draggedEntityPosition]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only respond to left-clicks.
      if (e.button !== 0) {
        return;
      }

      // If the click originated inside an entity node, stop.
      if ((e.target as HTMLElement).closest('[data-testid^="entity-node-"]')) {
        return;
      }

      // Deselect any entity if the click is on the empty canvas.
      onSelectEntity(null);
    },
    [onSelectEntity]
  );

  const handleCenterOnEntity = useCallback(
    (entityId: string) => {
      viewport.centerOnEntity(entityId);
      // Selects the entity after centering.
      onSelectEntity(entityId);
    },
    [viewport, onSelectEntity]
  );

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white overflow-hidden"
      onMouseDown={handleCanvasMouseDown}
      onWheel={viewport.handleWheel}
      style={{
        backgroundImage: `
          linear-gradient(to right, #E2E8F0 1px, transparent 1px),
          linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
        `,
        backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
        backgroundPosition: `${viewport.panOffset.x}px ${viewport.panOffset.y}px`,
        fontFamily: 'sans-serif',
      }}
      data-testid="graph-canvas"
    >
      <RelationshipLayer
        entities={entitiesWithDragOverride}
        relationships={relationships}
        zoom={viewport.zoom}
        panOffset={viewport.panOffset}
        onUpdateRelationshipWaypoints={onUpdateRelationshipWaypoints}
      />

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${viewport.panOffset.x}px, ${viewport.panOffset.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          transition: 'transform 0.2s ease-out',
          zIndex: 2,
        }}
      >
        {entitiesWithDragOverride.map((entity) => {
          const isMatch =
            search.hasSearchQuery && search.matchingEntities.some((e) => e.id === entity.id);
          // Dim entities that don't match the search query
          const shouldDim = search.hasSearchQuery && !isMatch;

          // CRITICAL FIX: Determine if this entity is the one being dragged
          const isBeingDragged = drag.draggedEntityId === entity.id;

          return (
            <EntityNode
              key={entity.id}
              entity={entity}
              isSelected={selectedEntityId === entity.id}
              isSearchMatch={isMatch}
              dimmed={shouldDim}
              // Conditional style to use opacity: 0 on the source node while the ghost is active.
              style={{
                left: entity.position?.x || 100,
                top: entity.position?.y || 100,
                // We use opacity: 0 instead of visibility: hidden so the drag source remains in the DOM tree
                opacity: isBeingDragged ? 0 : 1,
              }}
              // Passes the entity ID string
              onSelect={() => onSelectEntity(entity.id)}
              onDragStart={(e) => drag.handleEntityDragStart(entity.id, e)}
              onDrag={drag.handleEntityDrag}
              onDragEnd={drag.handleEntityDragEnd}
              // Now passes the full entity object
              onDoubleClick={() => onEntityDoubleClick(entity)}
              // Now passes the full entity object
              onGenerateDLO={onGenerateDLO ? () => onGenerateDLO(entity) : undefined}
              // Now passes the full entity object
              onGenerateDMO={onGenerateDMO ? () => onGenerateDMO(entity) : undefined}
            />
          );
        })}
      </div>

      <ViewportControls
        zoom={viewport.zoom}
        onZoomIn={viewport.handleZoomIn}
        onZoomOut={viewport.handleZoomOut}
        onFitToScreen={viewport.handleFitToScreen}
        onResetView={viewport.handleResetView}
      />

      <SearchResultsPanel
        matchingEntities={search.matchingEntities}
        searchQuery={searchQuery}
        onCenterOnEntity={handleCenterOnEntity}
      />

      {/* Renders a message if no entities exist */}
      {entities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl font-semibold text-coolgray-400">No entities yet</p>
            <p className="text-sm text-coolgray-500 mt-2">
              Click the + button to add your first entity
            </p>
          </div>
        </div>
      )}

      <CanvasLegend />
    </div>
  );
}
