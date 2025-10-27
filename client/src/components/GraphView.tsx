import { useRef, useState, useEffect } from "react";
import { Plus, Minus, Maximize2, RotateCcw, Target } from "lucide-react";
import EntityNode from "./EntityNode";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Entity } from "@shared/schema";

interface GraphViewProps {
  entities: Entity[];
  selectedEntityId: string | null;
  searchQuery?: string;
  onSelectEntity: (entityId: string | null) => void;
  onUpdateEntityPosition: (entityId: string, position: { x: number; y: number }) => void;
  onEntityDoubleClick: (entityId: string) => void;
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
  selectedEntityId,
  searchQuery = '',
  onSelectEntity,
  onUpdateEntityPosition,
  onEntityDoubleClick,
}: GraphViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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
    
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    onSelectEntity(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
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
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 320);
      maxY = Math.max(maxY, y + 200);
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

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

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

    const formatCardinality = (cardinality: string) => {
      switch (cardinality) {
        case 'one-to-one': return '1:1';
        case 'one-to-many': return '1:M';
        case 'many-to-one': return 'M:1';
        default: return cardinality;
      }
    };

    entities.forEach((entity) => {
      entity.fields.forEach((field) => {
        if (field.isFK && field.fkReference && field.visibleInERD !== false) {
          const targetEntity = entities.find(e => e.id === field.fkReference!.targetEntityId);
          if (!targetEntity) return;

          const sourcePos = entity.position || { x: 100, y: 100 };
          const targetPos = targetEntity.position || { x: 400, y: 100 };

          const startX = sourcePos.x + 160;
          const startY = sourcePos.y + 60;
          const endX = targetPos.x;
          const endY = targetPos.y + 60;

          const cardinalityLabel = formatCardinality(field.fkReference.cardinality);
          const relationshipLabel = field.fkReference.relationshipLabel;

          lines.push(
            <g key={`${entity.id}-${field.id}`}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#94A3B8"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(startX + endX) / 2}
                y={(startY + endY) / 2 - 8}
                fill="#64748B"
                fontSize="11"
                className="font-mono font-semibold"
                textAnchor="middle"
              >
                {cardinalityLabel}
              </text>
              {relationshipLabel && (
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 + 8}
                  fill="#64748B"
                  fontSize="10"
                  className="italic"
                  textAnchor="middle"
                >
                  "{relationshipLabel}"
                </text>
              )}
            </g>
          );
        }
      });
    });

    return lines;
  };


  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
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
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#94A3B8" />
          </marker>
        </defs>
        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
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
    </div>
  );
}
