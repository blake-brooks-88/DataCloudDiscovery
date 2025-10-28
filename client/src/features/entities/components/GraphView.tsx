import { useRef } from 'react';
import type { Entity, Relationship } from '@shared/schema';
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
 */
export interface GraphViewProps {
  entities: Entity[];
  relationships?: Relationship[];
  selectedEntityId: string | null;
  searchQuery?: string;
  onSelectEntity: (entityId: string | null) => void;
  onUpdateEntityPosition: (entityId: string, position: { x: number; y: number }) => void;
  onEntityDoubleClick: (entityId: string) => void;
  onGenerateDLO?: (entityId: string) => void;
  onGenerateDMO?: (entityId: string) => void;
  onUpdateRelationshipWaypoints: (
    entityId: string,
    fieldId: string,
    waypoints: { x: number; y: number }[]
  ) => void;
}

/**
 * Interactive canvas for displaying and manipulating entity relationship diagrams.
 * Supports pan, zoom, drag-and-drop, search, and relationship visualization.
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

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    if ((e.target as HTMLElement).closest('[data-testid^="entity-node-"]')) {
      return;
    }

    onSelectEntity(null);
  };

  const handleCenterOnEntity = (entityId: string) => {
    viewport.centerOnEntity(entityId);
    onSelectEntity(entityId);
  };

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
        entities={entities}
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
        {entities.map((entity) => {
          const isMatch =
            search.hasSearchQuery && search.matchingEntities.some((e) => e.id === entity.id);
          const shouldDim = search.hasSearchQuery && !isMatch;

          return (
            <EntityNode
              key={entity.id}
              entity={entity}
              isSelected={selectedEntityId === entity.id}
              isSearchMatch={isMatch}
              dimmed={shouldDim}
              onSelect={() => onSelectEntity(entity.id)}
              onDragStart={(e) => drag.handleEntityDragStart(entity.id, e)}
              onDrag={drag.handleEntityDrag}
              onDragEnd={drag.handleEntityDragEnd}
              onDoubleClick={() => onEntityDoubleClick(entity.id)}
              onGenerateDLO={onGenerateDLO}
              onGenerateDMO={onGenerateDMO}
              style={{
                left: entity.position?.x || 100,
                top: entity.position?.y || 100,
              }}
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

      {entities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-400">No entities yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Click the + button to add your first entity
            </p>
          </div>
        </div>
      )}

      <CanvasLegend />
    </div>
  );
}
