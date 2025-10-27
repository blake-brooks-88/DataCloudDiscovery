import { useRef, useState, useEffect } from "react";
import EntityNode from "./EntityNode";
import type { Entity, SourceSystem } from "@shared/schema";

interface GraphViewProps {
  entities: Entity[];
  sourceSystems: SourceSystem[];
  selectedEntityId: string | null;
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
  sourceSystems,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntityPosition,
  onEntityDoubleClick,
}: GraphViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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

  const renderRelationshipLines = () => {
    const lines: JSX.Element[] = [];

    entities.forEach((entity) => {
      entity.fields.forEach((field) => {
        if (field.isFK && field.fkReference) {
          const targetEntity = entities.find(e => e.id === field.fkReference!.targetEntityId);
          if (!targetEntity) return;

          const sourcePos = entity.position || { x: 100, y: 100 };
          const targetPos = targetEntity.position || { x: 400, y: 100 };

          const startX = sourcePos.x + 160;
          const startY = sourcePos.y + 60;
          const endX = targetPos.x;
          const endY = targetPos.y + 60;

          const cardinalityLabel = field.fkReference.cardinality || '';

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
                y={(startY + endY) / 2 - 5}
                fill="#64748B"
                fontSize="11"
                className="font-mono"
              >
                {cardinalityLabel}
              </text>
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
      style={{
        backgroundImage: `
          linear-gradient(to right, #E2E8F0 1px, transparent 1px),
          linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
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
        <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
          {renderRelationshipLines()}
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          zIndex: 2,
        }}
      >
        {entities.map((entity) => (
          <EntityNode
            key={entity.id}
            entity={entity}
            isSelected={selectedEntityId === entity.id}
            onSelect={() => onSelectEntity(entity.id)}
            onDragStart={(e) => handleEntityDragStart(entity.id, e)}
            onDrag={handleEntityDrag}
            onDragEnd={handleEntityDragEnd}
            style={{
              left: entity.position?.x || 100,
              top: entity.position?.y || 100,
            }}
          />
        ))}
      </div>

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
