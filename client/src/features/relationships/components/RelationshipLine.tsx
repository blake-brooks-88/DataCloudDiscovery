import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Entity, Field } from '@shared/schema';
/**
 * Props for the RelationshipLine component.
 */
interface RelationshipLineProps {
  /** The source entity object. */
  sourceEntity: Entity;
  /** The target entity object. */
  targetEntity: Entity;
  /** The specific source field containing the FK reference. */
  field: Field;
  /** Current canvas zoom level. */
  zoom: number;
  /** Current canvas pan offset. */
  panOffset: { x: number; y: number };
  /** Callback function when waypoints are updated via interaction. */
  onUpdateWaypoints: (fieldId: string, waypoints: { x: number; y: number }[]) => void;
}

/**
 * Renders a complex, multi-segment SVG line for FK relationships ('references').
 * Supports orthogonal path generation, waypoint dragging, adding/removing waypoints,
 * and displaying cardinality/labels.
 *
 * @param {RelationshipLineProps} props The component props.
 * @returns {JSX.Element} An SVG <g> element representing the line.
 */
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

  // --- Entity Layout Constants ---
  const ENTITY_WIDTH = 320;
  const HEADER_HEIGHT = 52;
  const METADATA_HEIGHT = 36;
  const FIELD_HEIGHT = 28;
  const PADDING_TOP = HEADER_HEIGHT + METADATA_HEIGHT;
  // ---

  const GRID_SIZE = 20;

  // Calculate Y position for the source field (FK field).
  const sourceFieldIndex = useMemo(
    () =>
      sourceEntity.fields
        .filter((f) => f.visibleInERD !== false)
        .findIndex((f) => f.id === field.id),
    [sourceEntity.fields, field.id]
  );

  const sourceFieldY = useMemo(
    () => sourcePos.y + PADDING_TOP + sourceFieldIndex * FIELD_HEIGHT + FIELD_HEIGHT / 2,
    [sourcePos.y, PADDING_TOP, sourceFieldIndex]
  );

  // Calculate Y position for the target field (PK field).
  const targetFieldId = field.fkReference?.targetFieldId;
  const targetFieldIndex = useMemo(
    () =>
      targetEntity.fields
        .filter((f) => f.visibleInERD !== false)
        .findIndex((f) => f.id === targetFieldId),
    [targetEntity.fields, targetFieldId]
  );

  const targetFieldY = useMemo(
    () => targetPos.y + PADDING_TOP + targetFieldIndex * FIELD_HEIGHT + FIELD_HEIGHT / 2,
    [targetPos.y, PADDING_TOP, targetFieldIndex]
  );

  // Define line start/end points.
  const startX = useMemo(() => sourcePos.x + ENTITY_WIDTH, [sourcePos.x]);
  const startY = useMemo(
    () => (sourceFieldY >= 0 ? sourceFieldY : sourcePos.y + PADDING_TOP),
    [sourceFieldY, sourcePos.y, PADDING_TOP]
  );
  const endX = useMemo(() => targetPos.x, [targetPos.x]);
  const endY = useMemo(
    () => (targetFieldY >= 0 ? targetFieldY : targetPos.y + PADDING_TOP),
    [targetFieldY, targetPos.y, PADDING_TOP]
  );

  const waypoints = useMemo(() => field.fkReference?.waypoints || [], [field.fkReference]);
  const cardinality = useMemo(
    () => field.fkReference?.cardinality || 'many-to-one',
    [field.fkReference]
  );

  /**
   * Generates the SVG path data for an orthogonal line connecting through waypoints.
   * Creates a multi-segment path that alternates horizontal and vertical lines.
   * @returns {string} The SVG path data string.
   */
  const createPath = useCallback(() => {
    if (waypoints.length === 0) {
      // Default orthogonal routing if no waypoints exist.
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
    }

    let path = `M ${startX} ${startY}`;
    const firstWp = waypoints[0];

    // Ensure first waypoint exists before proceeding (type guard)
    if (!firstWp) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    } // Fallback to straight line

    // Initial segments: H -> V to the first waypoint
    path += ` L ${firstWp.x} ${startY}`;
    path += ` L ${firstWp.x} ${firstWp.y}`;

    // Iterate through remaining waypoints, creating alternating H/V segments
    for (let i = 1; i < waypoints.length; i++) {
      const prevWp = waypoints[i - 1];
      const currWp = waypoints[i];

      // Ensure waypoints exist (type guard)
      if (!prevWp || !currWp) {
        continue;
      }

      // Logic determines segment order based on waypoint index
      if (i % 2 === 1) {
        // Odd index: H -> V
        path += ` L ${currWp.x} ${prevWp.y}`;
        path += ` L ${currWp.x} ${currWp.y}`;
      } else {
        // Even index: V -> H
        path += ` L ${prevWp.x} ${currWp.y}`;
        path += ` L ${currWp.x} ${currWp.y}`;
      }
    }

    // Final segments connecting the last waypoint to the end point
    const lastWp = waypoints[waypoints.length - 1];
    if (!lastWp) {
      return path;
    } // Should not happen if loop ran, but safe guard

    // Logic determines final segment order based on total waypoint count
    if (waypoints.length % 2 === 1) {
      // Odd count: H -> V to end
      path += ` L ${endX} ${lastWp.y}`;
      path += ` L ${endX} ${endY}`;
    } else {
      // Even count: V -> H to end
      path += ` L ${lastWp.x} ${endY}`;
      path += ` L ${endX} ${endY}`;
    }

    return path;
  }, [startX, startY, endX, endY, waypoints]);

  /**
   * Initiates dragging for a specific waypoint.
   */
  const handleWaypointMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedWaypointIndex(index);
  }, []);

  /**
   * Handles mouse movement during waypoint drag, updating the position.
   */
  const handleWaypointMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggedWaypointIndex === null) {
        return;
      }

      // Convert global mouse coordinates to local SVG coordinates, accounting for pan/zoom
      const rawX = (e.clientX - panOffset.x) / zoom;
      const rawY = (e.clientY - panOffset.y) / zoom;

      // Snap coordinates to the grid
      const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

      // Create a new waypoints array with the updated position
      const newWaypoints = waypoints.map((wp, index) => {
        if (index !== draggedWaypointIndex) {
          return wp;
        }
        return { x: snappedX, y: snappedY };
      });

      onUpdateWaypoints(field.id, newWaypoints);
    },
    [draggedWaypointIndex, onUpdateWaypoints, panOffset.x, panOffset.y, zoom, waypoints, field.id]
  );

  /**
   * Ends the waypoint drag operation.
   */
  const handleWaypointMouseUp = useCallback(() => {
    setDraggedWaypointIndex(null);
  }, []);

  /**
   * Adds a new waypoint at the clicked position on the line.
   */
  const handleLineClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.detail === 2) {
        return;
      } // Ignore double clicks which are for removing waypoints

      // Calculate click position relative to SVG canvas, accounting for pan/zoom
      const svgElement = e.currentTarget as SVGGraphicsElement;
      const point = svgElement.ownerSVGElement?.createSVGPoint();
      if (!point) {
        return;
      }

      point.x = e.clientX;
      point.y = e.clientY;

      const svgPoint = point.matrixTransform(svgElement.getScreenCTM()?.inverse());
      if (!svgPoint) {
        return;
      }

      // Snap to grid
      const snappedX = Math.round(svgPoint.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(svgPoint.y / GRID_SIZE) * GRID_SIZE;

      const newWaypoints = [...waypoints, { x: snappedX, y: snappedY }];
      onUpdateWaypoints(field.id, newWaypoints);
    },
    [waypoints, onUpdateWaypoints, field.id]
  );

  /**
   * Removes a waypoint on double click.
   */
  const handleWaypointDoubleClick = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newWaypoints = waypoints.filter((_, i) => i !== index);
      onUpdateWaypoints(field.id, newWaypoints);
    },
    [waypoints, onUpdateWaypoints, field.id]
  );

  // Effect to manage global mouse listeners for dragging
  useEffect(() => {
    if (draggedWaypointIndex === null) {
      return;
    }

    window.addEventListener('mousemove', handleWaypointMouseMove);
    window.addEventListener('mouseup', handleWaypointMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWaypointMouseMove);
      window.removeEventListener('mouseup', handleWaypointMouseUp);
    };
  }, [draggedWaypointIndex, handleWaypointMouseMove, handleWaypointMouseUp]);

  let cardinalityLabel = '';
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

  const pathData = createPath();

  /**
   * Renders the start marker (crow's foot notation).
   */
  const drawStartMarker = useCallback(() => {
    const markerSize = 12;
    if (cardinality === 'one-to-one' || cardinality === 'one-to-many') {
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
      // "Many" marker
      return (
        <g>
          <line
            x1={startX}
            y1={startY}
            x2={startX + markerSize}
            y2={startY - markerSize / 2}
            stroke="#64748B"
            strokeWidth="2"
          />
          <line
            x1={startX}
            y1={startY}
            x2={startX + markerSize}
            y2={startY}
            stroke="#64748B"
            strokeWidth="2"
          />
          <line
            x1={startX}
            y1={startY}
            x2={startX + markerSize}
            y2={startY + markerSize / 2}
            stroke="#64748B"
            strokeWidth="2"
          />
        </g>
      );
    }
  }, [cardinality, startX, startY]);

  /**
   * Renders the end marker (crow's foot notation).
   */
  const drawEndMarker = useCallback(() => {
    const markerSize = 12;
    if (cardinality === 'one-to-one' || cardinality === 'many-to-one') {
      // "One" marker
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
      // "Many" marker
      return (
        <g>
          <line
            x1={endX}
            y1={endY}
            x2={endX - markerSize}
            y2={endY - markerSize / 2}
            stroke="#64748B"
            strokeWidth="2"
          />
          <line
            x1={endX}
            y1={endY}
            x2={endX - markerSize}
            y2={endY}
            stroke="#64748B"
            strokeWidth="2"
          />
          <line
            x1={endX}
            y1={endY}
            x2={endX - markerSize}
            y2={endY + markerSize / 2}
            stroke="#64748B"
            strokeWidth="2"
          />
        </g>
      );
    }
  }, [cardinality, endX, endY]);

  // Calculate midpoint for labels, safely accessing waypoints.
  const midPointWaypoint = useMemo(() => waypoints[Math.floor(waypoints.length / 2)], [waypoints]);
  const midX = useMemo(
    () => (waypoints.length > 0 && midPointWaypoint ? midPointWaypoint.x : (startX + endX) / 2),
    [waypoints, midPointWaypoint, startX, endX]
  );
  const midY = useMemo(
    () => (waypoints.length > 0 && midPointWaypoint ? midPointWaypoint.y : (startY + endY) / 2),
    [waypoints, midPointWaypoint, startY, endY]
  );

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Invisible wider path for easier interaction */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        onClick={handleLineClick}
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
      />
      {/* Visible line */}
      <path
        d={pathData}
        stroke={isHovered ? '#3b82f6' : '#64748B'}
        strokeWidth={isHovered ? 3 : 2}
        fill="none"
        style={{ pointerEvents: 'none' }}
      />

      {drawStartMarker()}
      {drawEndMarker()}

      <text
        x={midX}
        y={midY - 8}
        fill="#334155"
        fontSize="11"
        fontWeight="600"
        textAnchor="middle"
        style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
      >
        {cardinalityLabel}
      </text>

      {field.fkReference?.relationshipLabel && (
        <text
          x={midX}
          y={midY + 8}
          fill="#64748B"
          fontSize="10"
          fontStyle="italic"
          textAnchor="middle"
          style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
        >
          {field.fkReference.relationshipLabel}
        </text>
      )}

      {/* Waypoint drag handles */}
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
          <ellipse cx={wp.x} cy={wp.y} rx="4" ry="3" fill="#3b82f6" />
        </g>
      ))}
    </g>
  );
}
