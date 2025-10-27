import { useState } from "react";
import type { Entity, Field, Cardinality } from "@shared/schema";

interface RelationshipLineProps {
  sourceEntity: Entity;
  targetEntity: Entity;
  field: Field;
  zoom: number;
  panOffset: { x: number; y: number };
  onUpdateWaypoints: (fieldId: string, waypoints: { x: number; y: number }[]) => void;
}

export default function RelationshipLine({
  sourceEntity,
  targetEntity,
  field,
  zoom,
  panOffset,
  onUpdateWaypoints,
}: RelationshipLineProps) {
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const sourcePos = sourceEntity.position || { x: 100, y: 100 };
  const targetPos = targetEntity.position || { x: 400, y: 100 };

  const startX = sourcePos.x + 140;
  const startY = sourcePos.y + 75;
  const endX = targetPos.x;
  const endY = targetPos.y + 75;

  const waypoints = field.fkReference?.waypoints || [];
  const cardinality = field.fkReference?.cardinality || 'many-to-one';

  // Create path through all waypoints
  const createPath = () => {
    if (waypoints.length === 0) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    let path = `M ${startX} ${startY}`;
    
    // Create smooth curves through waypoints
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      if (i === 0) {
        // First waypoint: quadratic curve from start
        const controlX = (startX + wp.x) / 2;
        const controlY = (startY + wp.y) / 2;
        path += ` Q ${controlX} ${controlY}, ${wp.x} ${wp.y}`;
      } else {
        // Subsequent waypoints: line to waypoint
        path += ` L ${wp.x} ${wp.y}`;
      }
    }
    
    // Final segment to end
    const lastWp = waypoints[waypoints.length - 1];
    const controlX = (lastWp.x + endX) / 2;
    const controlY = (lastWp.y + endY) / 2;
    path += ` Q ${controlX} ${controlY}, ${endX} ${endY}`;
    
    return path;
  };

  const handleWaypointMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedWaypointIndex(index);
  };

  const handleWaypointMouseMove = (e: MouseEvent) => {
    if (draggedWaypointIndex === null) return;

    const newWaypoints = [...waypoints];
    newWaypoints[draggedWaypointIndex] = {
      x: (e.clientX - panOffset.x) / zoom,
      y: (e.clientY - panOffset.y) / zoom,
    };
    onUpdateWaypoints(field.id, newWaypoints);
  };

  const handleWaypointMouseUp = () => {
    setDraggedWaypointIndex(null);
  };

  const handleLineClick = (e: React.MouseEvent) => {
    if (e.detail === 2) return; // Ignore double clicks

    // Add waypoint at click position
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    const newWaypoints = [...waypoints, { x, y }];
    onUpdateWaypoints(field.id, newWaypoints);
  };

  const handleWaypointDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    onUpdateWaypoints(field.id, newWaypoints);
  };

  // Determine crow's foot markers based on cardinality
  let markerStart = '';
  let markerEnd = '';
  let cardinalityLabel = '';

  switch (cardinality) {
    case 'one-to-one':
      markerStart = 'url(#cf-one)';
      markerEnd = 'url(#cf-one)';
      cardinalityLabel = '1:1';
      break;
    case 'one-to-many':
      markerStart = 'url(#cf-one)';
      markerEnd = 'url(#cf-many)';
      cardinalityLabel = '1:M';
      break;
    case 'many-to-one':
      markerStart = 'url(#cf-many)';
      markerEnd = 'url(#cf-one)';
      cardinalityLabel = 'M:1';
      break;
  }

  const pathData = createPath();
  
  // Calculate midpoint for label
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
      {/* Invisible thick line for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        onClick={handleLineClick}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible line */}
      <path
        d={pathData}
        stroke={isHovered ? "#3b82f6" : "#64748B"}
        strokeWidth={isHovered ? "3" : "2"}
        fill="none"
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{ pointerEvents: 'none' }}
      />

      {/* Cardinality label */}
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

      {/* Relationship label */}
      {field.fkReference?.relationshipLabel && (
        <text
          x={midX}
          y={midY + 8}
          fill="#64748B"
          fontSize="10"
          fontStyle="italic"
          textAnchor="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {field.fkReference.relationshipLabel}
        </text>
      )}

      {/* Waypoint handles (pills) */}
      {waypoints.map((wp, index) => (
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
