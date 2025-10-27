import { useState } from "react";
import type { Entity, Field, Cardinality } from "@shared/schema";

interface FieldLevelLineProps {
  sourceEntity: Entity;
  targetEntity: Entity;
  sourceField: Field;
  targetField: Field;
  relationshipType: 'transforms-to' | 'references';
  zoom: number;
  panOffset: { x: number; y: number };
  onUpdateWaypoints?: (fieldId: string, waypoints: { x: number; y: number }[]) => void;
  cardinality?: Cardinality;
  relationshipLabel?: string;
  waypoints?: { x: number; y: number }[];
}

export default function FieldLevelLine({
  sourceEntity,
  targetEntity,
  sourceField,
  targetField,
  relationshipType,
  zoom,
  panOffset,
  onUpdateWaypoints,
  cardinality = 'many-to-one',
  relationshipLabel,
  waypoints: externalWaypoints,
}: FieldLevelLineProps) {
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const style = relationshipType === 'transforms-to' 
    ? {
        stroke: '#BED163',
        strokeWidth: 2,
        strokeDasharray: '8,4',
        showCardinality: false,
      }
    : {
        stroke: '#64748B',
        strokeWidth: 2,
        strokeDasharray: 'none',
        showCardinality: true,
      };

  const sourcePos = sourceEntity.position || { x: 100, y: 100 };
  const targetPos = targetEntity.position || { x: 400, y: 100 };

  const ENTITY_WIDTH = 320;
  const HEADER_HEIGHT = 52;
  const METADATA_HEIGHT = 36;
  const FIELD_HEIGHT = 28;
  const PADDING_TOP = HEADER_HEIGHT + METADATA_HEIGHT;
  
  const GRID_SIZE = 20;

  const sourceFieldIndex = sourceEntity.fields.filter(f => f.visibleInERD !== false).findIndex(f => f.id === sourceField.id);
  const sourceFieldY = sourcePos.y + PADDING_TOP + (sourceFieldIndex * FIELD_HEIGHT) + (FIELD_HEIGHT / 2);

  const targetFieldIndex = targetEntity.fields.filter(f => f.visibleInERD !== false).findIndex(f => f.id === targetField.id);
  const targetFieldY = targetPos.y + PADDING_TOP + (targetFieldIndex * FIELD_HEIGHT) + (FIELD_HEIGHT / 2);

  const startX = sourcePos.x + ENTITY_WIDTH;
  const startY = sourceFieldY >= 0 ? sourceFieldY : sourcePos.y + PADDING_TOP;
  const endX = targetPos.x;
  const endY = targetFieldY >= 0 ? targetFieldY : targetPos.y + PADDING_TOP;

  const waypoints = externalWaypoints || sourceField.fkReference?.waypoints || [];

  const createPath = () => {
    if (waypoints.length === 0) {
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
    }

    let path = `M ${startX} ${startY}`;
    
    path += ` L ${waypoints[0].x} ${startY}`;
    path += ` L ${waypoints[0].x} ${waypoints[0].y}`;
    
    for (let i = 1; i < waypoints.length; i++) {
      const prevWp = waypoints[i - 1];
      const currWp = waypoints[i];
      
      if (i % 2 === 1) {
        path += ` L ${currWp.x} ${prevWp.y}`;
        path += ` L ${currWp.x} ${currWp.y}`;
      } else {
        path += ` L ${prevWp.x} ${currWp.y}`;
        path += ` L ${currWp.x} ${currWp.y}`;
      }
    }
    
    const lastWp = waypoints[waypoints.length - 1];
    if (waypoints.length % 2 === 1) {
      path += ` L ${endX} ${lastWp.y}`;
      path += ` L ${endX} ${endY}`;
    } else {
      path += ` L ${lastWp.x} ${endY}`;
      path += ` L ${endX} ${endY}`;
    }
    
    return path;
  };

  const handleWaypointMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedWaypointIndex(index);
  };

  const handleWaypointMouseMove = (e: MouseEvent) => {
    if (draggedWaypointIndex === null || !onUpdateWaypoints) return;

    const rawX = (e.clientX - panOffset.x) / zoom;
    const rawY = (e.clientY - panOffset.y) / zoom;
    
    const newWaypoints = [...waypoints];
    newWaypoints[draggedWaypointIndex] = {
      x: Math.round(rawX / GRID_SIZE) * GRID_SIZE,
      y: Math.round(rawY / GRID_SIZE) * GRID_SIZE,
    };
    onUpdateWaypoints(sourceField.id, newWaypoints);
  };

  const handleWaypointMouseUp = () => {
    setDraggedWaypointIndex(null);
  };

  const handleLineClick = (e: React.MouseEvent) => {
    if (e.detail === 2 || !onUpdateWaypoints) return;

    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const rawX = (e.clientX - rect.left - panOffset.x) / zoom;
    const rawY = (e.clientY - rect.top - panOffset.y) / zoom;

    const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    const newWaypoints = [...waypoints, { x: snappedX, y: snappedY }];
    onUpdateWaypoints(sourceField.id, newWaypoints);
  };

  const handleWaypointDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateWaypoints) return;
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    onUpdateWaypoints(sourceField.id, newWaypoints);
  };

  let cardinalityLabel = '';
  if (style.showCardinality) {
    switch (cardinality) {
      case 'one-to-one':
        cardinalityLabel = '1:1';
        break;
      case 'one-to-many':
        cardinalityLabel = '1:M';
        break;
      case 'many-to-one':
        cardinalityLabel = 'M:1';
        break;
    }
  }

  const pathData = createPath();
  
  const drawStartMarker = () => {
    if (!style.showCardinality) return null;
    
    const markerSize = 12;
    const markerColor = style.stroke;
    
    if (cardinality === 'one-to-one' || cardinality === 'one-to-many') {
      return (
        <line 
          x1={startX} 
          y1={startY - markerSize/2} 
          x2={startX} 
          y2={startY + markerSize/2} 
          stroke={markerColor} 
          strokeWidth="2" 
        />
      );
    } else {
      return (
        <g>
          <line x1={startX} y1={startY} x2={startX + markerSize} y2={startY - markerSize/2} stroke={markerColor} strokeWidth="2" />
          <line x1={startX} y1={startY} x2={startX + markerSize} y2={startY} stroke={markerColor} strokeWidth="2" />
          <line x1={startX} y1={startY} x2={startX + markerSize} y2={startY + markerSize/2} stroke={markerColor} strokeWidth="2" />
        </g>
      );
    }
  };
  
  const drawEndMarker = () => {
    if (!style.showCardinality) return null;
    
    const markerSize = 12;
    const markerColor = style.stroke;
    
    if (cardinality === 'one-to-one' || cardinality === 'many-to-one') {
      return (
        <line 
          x1={endX} 
          y1={endY - markerSize/2} 
          x2={endX} 
          y2={endY + markerSize/2} 
          stroke={markerColor} 
          strokeWidth="2" 
        />
      );
    } else {
      return (
        <g>
          <line x1={endX} y1={endY} x2={endX - markerSize} y2={endY - markerSize/2} stroke={markerColor} strokeWidth="2" />
          <line x1={endX} y1={endY} x2={endX - markerSize} y2={endY} stroke={markerColor} strokeWidth="2" />
          <line x1={endX} y1={endY} x2={endX - markerSize} y2={endY + markerSize/2} stroke={markerColor} strokeWidth="2" />
        </g>
      );
    }
  };
  
  const midX = waypoints.length > 0 
    ? waypoints[Math.floor(waypoints.length / 2)].x 
    : (startX + endX) / 2;
  const midY = waypoints.length > 0 
    ? waypoints[Math.floor(waypoints.length / 2)].y 
    : (startY + endY) / 2;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        onClick={handleLineClick}
        style={{ cursor: onUpdateWaypoints ? 'pointer' : 'default' }}
      />

      <path
        d={pathData}
        stroke={isHovered ? "#3b82f6" : style.stroke}
        strokeWidth={isHovered ? String(style.strokeWidth + 1) : String(style.strokeWidth)}
        strokeDasharray={style.strokeDasharray}
        fill="none"
        style={{ pointerEvents: 'none' }}
      />
      
      {drawStartMarker()}
      {drawEndMarker()}

      {style.showCardinality && cardinalityLabel && (
        <text
          x={midX}
          y={midY - 8}
          fill="#334155"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {cardinalityLabel}
        </text>
      )}

      {style.showCardinality && relationshipLabel && (
        <text
          x={midX}
          y={midY + 8}
          fill="#64748B"
          fontSize="10"
          fontStyle="italic"
          textAnchor="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {relationshipLabel}
        </text>
      )}

      {onUpdateWaypoints && waypoints.map((wp, index) => (
        <g
          key={index}
          onMouseDown={(e) => handleWaypointMouseDown(index, e)}
          onDoubleClick={(e) => handleWaypointDoubleClick(index, e)}
          style={{ cursor: 'move' }}
        >
          <ellipse
            cx={wp.x}
            cy={wp.y}
            rx="8"
            ry="6"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <ellipse
            cx={wp.x}
            cy={wp.y}
            rx="4"
            ry="3"
            fill="#3b82f6"
          />
        </g>
      ))}
    </g>
  );
}
