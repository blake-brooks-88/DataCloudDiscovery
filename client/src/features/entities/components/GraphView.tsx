import { useRef, useState, useEffect } from "react";
import { Plus, Minus, Maximize2, RotateCcw, Target } from "lucide-react";
import EntityNode from "./EntityNode";
import EntityLevelLine from "./EntityLevelLine";
import FieldLevelLine from "../relationships/FieldLevelLine";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Entity, Relationship } from "@shared/schema";

interface GraphViewProps {
  entities: Entity[];
  relationships?: Relationship[];
  selectedEntityId: string | null;
  searchQuery?: string;
  onSelectEntity: (entityId: string | null) => void;
  onUpdateEntityPosition: (entityId: string, position: { x: number; y: number }) => void;
  onEntityDoubleClick: (entityId: string) => void;
  onGenerateDLO?: (entityId: string) => void;
  onGenerateDMO?: (entityId: string) => void;
  onUpdateRelationshipWaypoints: (entityId: string, fieldId: string, waypoints: { x: number; y: number }[]) => void;
}

interface DragState {
  entityId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

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
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);

  const handleEntityDragStart = (entityId: string, e: React.DragEvent) => {
    e.stopPropagation();
    const entity = entities.find(ent => ent.id === entityId);
    if (!entity) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      entityId,
      startX: entity.position?.x || 100,
      startY: entity.position?.y || 100,
      offsetX: e.clientX - rect.left - (entity.position?.x || 100),
      offsetY: e.clientY - rect.top - (entity.position?.y || 100),
    });
  };

  const handleEntityDrag = (e: React.DragEvent) => {
    if (!dragState || !canvasRef.current) return;
    if (e.clientX === 0 && e.clientY === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragState.offsetX;
    const newY = e.clientY - rect.top - dragState.offsetY;

    onUpdateEntityPosition(dragState.entityId, { x: newX, y: newY });
  };

  const handleEntityDragEnd = () => {
    if (dragState) {
      const entity = entities.find(e => e.id === dragState.entityId);
      if (entity?.position) {
        const GRID_SIZE = 20;
        const snappedPosition = {
          x: Math.round(entity.position.x / GRID_SIZE) * GRID_SIZE,
          y: Math.round(entity.position.y / GRID_SIZE) * GRID_SIZE,
        };
        onUpdateEntityPosition(dragState.entityId, snappedPosition);
      }
    }
    setDragState(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-testid^="entity-node-"]')) return;

    onSelectEntity(null);
  };

  // Search matching logic
  const matchingEntities = entities.filter(entity =>
    searchQuery && entity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const hasSearchQuery = searchQuery.trim().length > 0;

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(5.0, prevZoom + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(0.1, prevZoom - 0.1));
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    if (entities.length === 0 || !canvasRef.current) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    entities.forEach(entity => {
      const x = entity.position?.x || 100;
      const y = entity.position?.y || 100;
      const ENTITY_WIDTH = 320;
      const ENTITY_HEIGHT = 200;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + ENTITY_WIDTH);
      maxY = Math.max(maxY, y + ENTITY_HEIGHT);
    });

    const bounds = {
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };

    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 100;
    const scaleX = (rect.width - padding * 2) / bounds.width;
    const scaleY = (rect.height - padding * 2) / bounds.height;
    const newZoom = Math.min(Math.max(scaleX, scaleY), 1.0);

    setZoom(newZoom);
    setPanOffset({
      x: rect.width / 2 - bounds.centerX * newZoom,
      y: rect.height / 2 - bounds.centerY * newZoom,
    });
  };

  const centerOnEntity = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    if (!entity || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const entityX = entity.position?.x || 100;
    const entityY = entity.position?.y || 100;

    if (zoom < 0.8) {
      setZoom(1.0);
    }

    setPanOffset({
      x: rect.width / 2 - (entityX + 160) * (zoom < 0.8 ? 1.0 : zoom),
      y: rect.height / 2 - (entityY + 100) * (zoom < 0.8 ? 1.0 : zoom),
    });

    onSelectEntity(entityId);
  };

  // Mouse wheel for pan and zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    // Ctrl/Cmd + scroll = zoom
    if (e.ctrlKey || e.metaKey) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(5.0, Math.max(0.1, zoom + delta));

      const scale = newZoom / zoom;
      setPanOffset({
        x: mouseX - (mouseX - panOffset.x) * scale,
        y: mouseY - (mouseY - panOffset.y) * scale,
      });

      setZoom(newZoom);
    } else if (e.shiftKey) {
      // Shift + scroll = horizontal pan
      setPanOffset({
        x: panOffset.x - e.deltaY,
        y: panOffset.y,
      });
    } else {
      // Regular scroll = vertical pan (or trackpad swipe)
      setPanOffset({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY,
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetView();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  const renderRelationshipLines = () => {
    const lines: JSX.Element[] = [];

    // 1. Entity-level lines (feeds-into: Data Stream → DLO)
    relationships
      .filter(rel => rel.type === 'feeds-into')
      .forEach(rel => {
        const sourceEntity = entities.find(e => e.id === rel.sourceEntityId);
        const targetEntity = entities.find(e => e.id === rel.targetEntityId);

        if (!sourceEntity || !targetEntity) return;

        lines.push(
          <EntityLevelLine
            key={rel.id}
            relationship={rel}
            sourceEntity={sourceEntity}
            targetEntity={targetEntity}
            zoom={zoom}
            panOffset={panOffset}
          />
        );
      });

    // 2. Field-level lines (transforms-to: DLO → DMO OR DMO → DMO)
    relationships
      .filter(rel => rel.type === 'transforms-to')
      .forEach(rel => {
        const sourceEntity = entities.find(e => e.id === rel.sourceEntityId);
        const targetEntity = entities.find(e => e.id === rel.targetEntityId);

        if (!sourceEntity || !targetEntity) return;

        // Get field mappings from relationship OR from target entity
        const mappings = rel.fieldMappings ||
          targetEntity.fieldMappings?.filter(fm => fm.sourceEntityId === sourceEntity.id) ||
          [];

        // Render one line per field mapping
        mappings.forEach(mapping => {
          const sourceField = sourceEntity.fields.find(f => f.id === mapping.sourceFieldId);
          const targetField = targetEntity.fields.find(f => f.id === mapping.targetFieldId);

          if (!sourceField || !targetField) return;

          lines.push(
            <FieldLevelLine
              key={`${rel.id}-${mapping.targetFieldId}`}
              sourceEntity={sourceEntity}
              targetEntity={targetEntity}
              sourceField={sourceField}
              targetField={targetField}
              relationshipType="transforms-to"
              zoom={zoom}
              panOffset={panOffset}
            />
          );
        });
      });

    // 3. Field-level lines (references: DMO → DMO FK relationships)
    entities.forEach(entity => {
      entity.fields
        .filter(f => f.isFK && f.fkReference && f.visibleInERD !== false)
        .forEach(field => {
          const targetEntity = entities.find(e => e.id === field.fkReference!.targetEntityId);
          const targetField = targetEntity?.fields.find(f => f.id === field.fkReference!.targetFieldId);

          if (!targetEntity || !targetField) return;

          lines.push(
            <FieldLevelLine
              key={`${entity.id}-${field.id}`}
              sourceEntity={entity}
              targetEntity={targetEntity}
              sourceField={field}
              targetField={targetField}
              relationshipType="references"
              cardinality={field.fkReference!.cardinality}
              relationshipLabel={field.fkReference!.relationshipLabel}
              waypoints={field.fkReference!.waypoints}
              zoom={zoom}
              panOffset={panOffset}
              onUpdateWaypoints={(fieldId, waypoints) =>
                onUpdateRelationshipWaypoints(entity.id, fieldId, waypoints)
              }
            />
          );
        });
    });

    return lines;
  };


  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white overflow-hidden"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      style={{
        backgroundImage: `
          linear-gradient(to right, #E2E8F0 1px, transparent 1px),
          linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
        `,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
      data-testid="graph-canvas"
    >
      <svg
        className="absolute inset-0"
        style={{
          zIndex: 1,
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#4AA0D9" />
          </marker>
          <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#BED163" />
          </marker>

          {/* Animated data flow pattern */}
          <pattern id="data-flow-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="10" r="2" fill="#4AA0D9" opacity="0.6">
              <animate attributeName="cx" from="5" to="25" dur="2s" repeatCount="indefinite" />
            </circle>
          </pattern>

          {/* Crow's foot notation markers for references relationships */}
          <marker id="cf-one" markerWidth="16" markerHeight="16" refX="8" refY="8" orient="auto">
            <line x1="8" y1="4" x2="8" y2="12" stroke="#64748B" strokeWidth="2" />
          </marker>
          <marker id="cf-many" markerWidth="16" markerHeight="16" refX="8" refY="8" orient="auto">
            <line x1="8" y1="8" x2="2" y2="4" stroke="#64748B" strokeWidth="2" />
            <line x1="8" y1="8" x2="2" y2="8" stroke="#64748B" strokeWidth="2" />
            <line x1="8" y1="8" x2="2" y2="12" stroke="#64748B" strokeWidth="2" />
          </marker>
        </defs>

        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`} style={{ pointerEvents: 'auto' }}>
          {renderRelationshipLines()}
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: 'transform 0.2s ease-out',
          zIndex: 2,
        }}
      >
        {entities.map((entity) => {
          const isMatch = hasSearchQuery && matchingEntities.some(e => e.id === entity.id);
          const shouldDim = hasSearchQuery && !isMatch;

          return (
            <EntityNode
              key={entity.id}
              entity={entity}
              isSelected={selectedEntityId === entity.id}
              isSearchMatch={isMatch}
              dimmed={shouldDim}
              onSelect={() => onSelectEntity(entity.id)}
              onDragStart={(e) => handleEntityDragStart(entity.id, e)}
              onDrag={handleEntityDrag}
              onDragEnd={handleEntityDragEnd}
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

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-2 flex flex-col gap-1 z-10">
        <Button size="sm" onClick={handleZoomIn} data-testid="button-zoom-in">
          <Plus className="h-4 w-4" />
        </Button>
        <div className="text-xs text-center font-mono" data-testid="text-zoom-level">
          {Math.round(zoom * 100)}%
        </div>
        <Button size="sm" onClick={handleZoomOut} data-testid="button-zoom-out">
          <Minus className="h-4 w-4" />
        </Button>
        <Separator />
        <Button size="sm" onClick={handleFitToScreen} title="Fit to Screen" data-testid="button-fit-screen">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleResetView} title="Reset View" data-testid="button-reset-view">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Results Panel */}
      {matchingEntities.length > 0 && searchQuery && (
        <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-3 w-80 z-10" data-testid="search-results-panel">
          <div className="text-sm font-semibold mb-2 text-coolgray-600">
            Found {matchingEntities.length} {matchingEntities.length === 1 ? 'entity' : 'entities'}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {matchingEntities.map(entity => (
              <div
                key={entity.id}
                className="p-2 hover:bg-coolgray-50 rounded cursor-pointer flex items-center justify-between"
                onClick={() => centerOnEntity(entity.id)}
                data-testid={`search-result-${entity.id}`}
              >
                <div>
                  <div className="font-medium text-sm text-coolgray-600">{entity.name}</div>
                  <div className="text-xs text-coolgray-500">
                    {entity.dataSource || 'No source'}
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Target className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {entities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl font-semibold text-coolgray-400">No entities yet</p>
            <p className="text-sm text-coolgray-500 mt-2">Click the + button to add your first entity</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-72 z-10" data-testid="legend-panel">
        <div className="text-sm font-semibold mb-3 text-coolgray-600">Legend</div>

        {/* Entity Types */}
        <div className="mb-3">
          <div className="text-xs font-medium text-coolgray-500 mb-2">Entity Types</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary-100 border border-secondary-400"></div>
              <span className="text-xs text-coolgray-600">Data Stream (Ingestion)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-tertiary-100 border border-tertiary-500"></div>
              <span className="text-xs text-coolgray-600">DLO (Raw Data)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary-100 border border-primary-500"></div>
              <span className="text-xs text-coolgray-600">DMO (Unified Model)</span>
            </div>
          </div>
        </div>

        {/* Relationships */}
        <div>
          <div className="text-xs font-medium text-coolgray-500 mb-2">Relationships</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg width="50" height="4" className="flex-shrink-0">
                <line x1="0" y1="2" x2="50" y2="2" stroke="#4AA0D9" strokeWidth="4" />
                <circle cx="10" cy="2" r="2" fill="#4AA0D9" opacity="0.6" />
              </svg>
              <span className="text-xs text-coolgray-600">Ingests (Data Stream → DLO)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="50" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="50" y2="1" stroke="#BED163" strokeWidth="2" strokeDasharray="8,4" />
              </svg>
              <span className="text-xs text-coolgray-600">Transforms (field lineage)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="50" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="50" y2="1" stroke="#64748B" strokeWidth="2" />
              </svg>
              <span className="text-xs text-coolgray-600">References (FK)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
