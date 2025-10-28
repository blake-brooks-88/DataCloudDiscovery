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

export function RelationshipLine({
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

  // Entity card dimensions
  const ENTITY_WIDTH = 320;
  const HEADER_HEIGHT = 52; // Header with name and badge
  const METADATA_HEIGHT = 36; // Metadata row
  const FIELD_HEIGHT = 28; // Approximate height per field
  const PADDING_TOP = HEADER_HEIGHT + METADATA_HEIGHT;

  const GRID_SIZE = 20;

  // Calculate Y position for the source field (FK field)
  const sourceFieldIndex = sourceEntity.fields.filter(f => f.visibleInERD !== false).findIndex(f => f.id === field.id);
  const sourceFieldY = sourcePos.y + PADDING_TOP + (sourceFieldIndex * FIELD_HEIGHT) + (FIELD_HEIGHT / 2);

  // Calculate Y position for the target field (PK field)
  const targetFieldId = field.fkReference?.targetFieldId;
  const targetFieldIndex = targetEntity.fields.filter(f => f.visibleInERD !== false).findIndex(f => f.id === targetFieldId);
  const targetFieldY = targetPos.y + PADDING_TOP + (targetFieldIndex * FIELD_HEIGHT) + (FIELD_HEIGHT / 2);

  // Connect from right edge of source to left edge of target
  const startX = sourcePos.x + ENTITY_WIDTH; // Right edge
  const startY = sourceFieldY >= 0 ? sourceFieldY : sourcePos.y + PADDING_TOP;
  const endX = targetPos.x;         // Left edge of target
  const endY = targetFieldY >= 0 ? targetFieldY : targetPos.y + PADDING_TOP;

  const waypoints = field.fkReference?.waypoints || [];
  const cardinality = field.fkReference?.cardinality || 'many-to-one';

  // Create orthogonal path (Manhattan routing)
  const createPath = () => {
    if (waypoints.length === 0) {
      // Default orthogonal routing: horizontal -> vertical -> horizontal
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
    }

    let path = `M ${startX} ${startY}`;

    // First segment: horizontal to first waypoint's X
    path += ` L ${waypoints[0].x} ${startY}`;

    // Then vertical to first waypoint's Y
    path += ` L ${waypoints[0].x} ${waypoints[0].y}`;

    // Connect through waypoints with orthogonal segments
    for (let i = 1; i < waypoints.length; i++) {
      const prevWp = waypoints[i - 1];
      const currWp = waypoints[i];

      // Alternate between horizontal and vertical segments
      if (i % 2 === 1) {
        // Horizontal then vertical
        path += ` L ${currWp.x} ${prevWp.y}`;
        path += ` L ${currWp.x} ${currWp.y}`;
      } else {
        // Vertical then horizontal
        path += ` L ${prevWp.x} ${currWp.y}`;
        path += ` L ${currWp.x} ${currWp.y}`;
      }
    }

    // Final segments to end point
    const lastWp = waypoints[waypoints.length - 1];
    if (waypoints.length % 2 === 1) {
      // Horizontal then vertical
      path += ` L ${endX} ${lastWp.y}`;
      path += ` L ${endX} ${endY}`;
    } else {
      // Vertical then horizontal
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
    if (draggedWaypointIndex === null) return;

    // Calculate position with snap-to-grid
    const rawX = (e.clientX - panOffset.x) / zoom;
    const rawY = (e.clientY - panOffset.y) / zoom;

    const newWaypoints = [...waypoints];
    newWaypoints[draggedWaypointIndex] = {
      x: Math.round(rawX / GRID_SIZE) * GRID_SIZE,
      y: Math.round(rawY / GRID_SIZE) * GRID_SIZE,
    };
    onUpdateWaypoints(field.id, newWaypoints);
  };

  const handleWaypointMouseUp = () => {
    setDraggedWaypointIndex(null);
  };

  const handleLineClick = (e: React.MouseEvent) => {
    if (e.detail === 2) return; // Ignore double clicks

    // Add waypoint at click position with snap-to-grid
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const rawX = (e.clientX - rect.left - panOffset.x) / zoom;
    const rawY = (e.clientY - rect.top - panOffset.y) / zoom;

    const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    const newWaypoints = [...waypoints, { x: snappedX, y: snappedY }];
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

  // For orthogonal routing, we need to draw markers separately at the correct positions
  // because SVG markers don't always orient correctly with multi-segment paths
  const drawStartMarker = () => {
    const markerSize = 12;
    if (cardinality === 'one-to-one' || cardinality === 'one-to-many') {
      // Draw "one" marker - single line
      return (
        <line
          x1={startX}
          y1={startY - markerSize / 2}
          x2={startX}
          y2={startY + markerSize / 2}
          stroke="#64748B"
          strokeWidth="2"
        />
      );
    } else {
      // Draw "many" marker - crow's foot
      return (
        <g>
          <line x1={startX} y1={startY} x2={startX + markerSize} y2={startY - markerSize / 2} stroke="#64748B" strokeWidth="2" />
          <line x1={startX} y1={startY} x2={startX + markerSize} y2={startY} stroke="#64748B" strokeWidth="2" />
          <line x1={startX} y1={startY} x2={startX + markerSize} y2={startY + markerSize / 2} stroke="#64748B" strokeWidth="2" />
        </g>
      );
    }
  };

  const drawEndMarker = () => {
    const markerSize = 12;
    if (cardinality === 'one-to-one' || cardinality === 'many-to-one') {
      // Draw "one" marker - single line
      return (
        <line
          x1={endX}
          y1={endY - markerSize / 2}
          x2={endX}
          y2={endY + markerSize / 2}
          stroke="#64748B"
          strokeWidth="2"
        />
      );
    } else {
      // Draw "many" marker - crow's foot
      return (
        <g>
          <line x1={endX} y1={endY} x2={endX - markerSize} y2={endY - markerSize / 2} stroke="#64748B" strokeWidth="2" />
          <line x1={endX} y1={endY} x2={endX - markerSize} y2={endY} stroke="#64748B" strokeWidth="2" />
          <line x1={endX} y1={endY} x2={endX - markerSize} y2={endY + markerSize / 2} stroke="#64748B" strokeWidth="2" />
        </g>
      );
    }
  };

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
        style={{ pointerEvents: 'none' }}
      />

      {/* Draw markers separately for better control */}
      {drawStartMarker()}
      {drawEndMarker()}

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
