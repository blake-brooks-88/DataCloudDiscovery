import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Entity, Field, Cardinality } from '@shared/schema';
import { Position } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';

/**
 * Props for the FieldLevelLine component.
 */
interface FieldLevelLineProps {
  // ... (omitted props for brevity)
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
  externalWaypoints?: { x: number; y: number }[];
}

/**
 * Memoized field-to-field SVG line component.
 * Only re-renders when entity positions, field data, or waypoints change.
 */
export const FieldLevelLine = React.memo(
  function FieldLevelLine({
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
    externalWaypoints,
  }: FieldLevelLineProps) {
    const [draggedWaypointIndex, setDraggedWaypointIndex] = useState<number | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Style token lookup based on relationship type
    const style = useMemo(
      () =>
        relationshipType === 'transforms-to'
          ? {
            stroke: '#BED163', // Tertiary-Green (Accent)
            strokeWidth: 2,
            strokeDasharray: '8,4',
            showCardinality: false,
          }
          : {
            stroke: '#64748B', // CoolGray-500 (Secondary Text/Iconography)
            strokeWidth: 2,
            strokeDasharray: 'none',
            showCardinality: true,
          },
      [relationshipType]
    );

    const GRID_SIZE = 20;

    // FIX: Correctly destructure 'path' from the utility function's return object.
    const { path, sourcePoint, targetPoint } = useMemo(() => {
      const waypoints = externalWaypoints || sourceField.fkReference?.waypoints || [];
      return getOrthogonalPath({
        sourceEntity,
        targetEntity,
        sourceFieldId: sourceField.id,
        targetFieldId: targetField.id,
        // Pass undefined if array is empty to allow default routing calculation
        waypoints: waypoints.length > 0 ? waypoints : undefined,
      });
    }, [sourceEntity, targetEntity, sourceField, targetField, externalWaypoints]);

    const waypoints = useMemo(() => externalWaypoints || sourceField.fkReference?.waypoints || [], [externalWaypoints, sourceField.fkReference]);

    // Access the path data and endpoints
    const pathData = path;
    const startX = sourcePoint.x;
    const startY = sourcePoint.y;
    const endX = targetPoint.x;
    const endY = targetPoint.y;
    const sourceEdge = sourcePoint.position;
    const targetEdge = targetPoint.position;

    // --- Waypoint Handlers (No changes, omitted for brevity) ---
    const handleWaypointMouseDown = useCallback((index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setDraggedWaypointIndex(index);
    }, []);

    const handleWaypointMouseMove = useCallback(
      (e: MouseEvent) => {
        if (draggedWaypointIndex === null || !onUpdateWaypoints) {
          return;
        }

        const rawX = (e.clientX - panOffset.x) / zoom;
        const rawY = (e.clientY - panOffset.y) / zoom;
        const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
        const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

        // Create a new waypoints array with the updated position
        const newWaypoints = waypoints.map((wp, index) => {
          if (index !== draggedWaypointIndex) {
            return wp;
          }
          return { x: snappedX, y: snappedY };
        });

        // NOTE: If using the single-waypoint H-V-H style, you must update the other derived waypoints here.
        // For simplicity, we are passing the single manipulated waypoint back to the store.
        onUpdateWaypoints(sourceField.id, newWaypoints);
      },
      [draggedWaypointIndex, onUpdateWaypoints, panOffset.x, panOffset.y, zoom, sourceField.id, waypoints]
    );

    const handleWaypointMouseUp = useCallback(() => {
      setDraggedWaypointIndex(null);
    }, []);

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

    // Cardinality label logic remains the same
    let cardinalityLabel = '';
    if (style.showCardinality) {
      switch (cardinality) {
        case 'one-to-one':
        case 'one-to-many':
          cardinalityLabel = '1:M';
          break;
        case 'many-to-one':
          cardinalityLabel = 'M:1';
          break;
      }
    }

    // Calculate midpoint for labels
    const midPointWaypoint = useMemo(() => waypoints[Math.floor(waypoints.length / 2)], [waypoints]);
    const midX = useMemo(
      () => (waypoints.length > 0 && midPointWaypoint ? midPointWaypoint.x : (startX + endX) / 2),
      [waypoints, midPointWaypoint, startX, endX]
    );
    const midY = useMemo(
      () => (waypoints.length > 0 && midPointWaypoint ? midPointWaypoint.y : (startY + endY) / 2),
      [waypoints, midPointWaypoint, startY, endY]
    );

    const waypointHandlePos = useMemo(() => waypoints[0], [waypoints]);

    /**
     * Renders the crow's foot or 'one' line marker based on cardinality and edge position.
     * This replaces the old, incomplete marker logic.
     * @param {Position} edge - The edge (Left, Right, Top, Bottom) where the marker should appear.
     * @param {number} x - The x coordinate of the connection point.
     * @param {number} y - The y coordinate of the connection point.
     * @param {boolean} isSourceMarker - True if this is the start/source of the line.
     * @returns {JSX.Element | null} The SVG marker geometry.
     */
    const drawMarker = useCallback((edge: Position, x: number, y: number, isSourceMarker: boolean) => {
      if (!style.showCardinality) {
        return null;
      }
      const markerSize = 12;
      const markerColor = style.stroke;

      // Cardinality at source side: 1 (for 1:1, 1:M) or M (for M:1, M:M - though M:M is implicit here)
      // Cardinality at target side: 1 (for 1:1, M:1) or M (for 1:M, M:M)
      const isOneSide = isSourceMarker ? (cardinality === 'one-to-one' || cardinality === 'one-to-many') : (cardinality === 'one-to-one' || cardinality === 'many-to-one');

      // Determine offsets based on the edge position
      let xOffset = 0;
      let yOffset = 0;
      if (edge === Position.Right) { xOffset = -markerSize };
      if (edge === Position.Left) { xOffset = markerSize };
      if (edge === Position.Bottom) { yOffset = -markerSize };
      if (edge === Position.Top) { yOffset = markerSize };

      if (isOneSide) {
        // "One" Marker (A simple perpendicular line)
        if (edge === Position.Left || edge === Position.Right) {
          // Vertical line for horizontal edges
          return <line x1={x} y1={y - markerSize / 2} x2={x} y2={y + markerSize / 2} stroke={markerColor} strokeWidth="2" />;
        } else {
          // Horizontal line for vertical edges
          return <line x1={x - markerSize / 2} y1={y} x2={x + markerSize / 2} y2={y} stroke={markerColor} strokeWidth="2" />;
        }
      } else {
        // "Many" Marker (Crow's Foot - simplified geometry)
        // Lines forming the crow's foot will be drawn relative to the connection point (x, y)
        const lines: JSX.Element[] = [];

        // Main line (always perpendicular to the edge)
        lines.push(<line key="main" x1={x} y1={y} x2={x + xOffset * 0.8} y2={y + yOffset * 0.8} stroke={markerColor} strokeWidth="2" />);

        // Angled lines (using a small perpendicular deviation)
        if (edge === Position.Right || edge === Position.Left) { // Horizontal edge
          lines.push(<line key="top" x1={x + xOffset * 0.8} y1={y - markerSize / 2} x2={x + xOffset} y2={y - markerSize / 2} stroke={markerColor} strokeWidth="2" />);
          lines.push(<line key="bottom" x1={x + xOffset * 0.8} y1={y + markerSize / 2} x2={x + xOffset} y2={y + markerSize / 2} stroke={markerColor} strokeWidth="2" />);
        } else { // Vertical edge
          lines.push(<line key="left" x1={x - markerSize / 2} y1={y + yOffset * 0.8} x2={x - markerSize / 2} y2={y + yOffset} stroke={markerColor} strokeWidth="2" />);
          lines.push(<line key="right" x1={x + markerSize / 2} y1={y + yOffset * 0.8} x2={x + markerSize / 2} y2={y + yOffset} stroke={markerColor} strokeWidth="2" />);
        }
        return <g>{lines}</g>;
      }
    }, [style.showCardinality, style.stroke, cardinality]);

    return (
      <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {/* Invisible wider path for easier interaction */}
        <path
          d={pathData}
          stroke="transparent"
          strokeWidth="12"
          fill="none"
          style={{ pointerEvents: 'stroke' }}
        />
        {/* Visible line */}
        <path
          d={pathData}
          stroke={isHovered ? '#3b82f6' : style.stroke}
          strokeWidth={isHovered ? String(style.strokeWidth + 1) : String(style.strokeWidth)}
          strokeDasharray={style.strokeDasharray}
          fill="none"
          style={{ pointerEvents: 'none' }}
        />

        {/* Renders dynamic start marker */}
        {drawMarker(sourceEdge, startX, startY, true)}
        {/* Renders dynamic end marker */}
        {drawMarker(targetEdge, endX, endY, false)}

        {style.showCardinality && cardinalityLabel && (
          <text
            x={midX}
            y={midY - 8}
            fill="#334155" // CoolGray-700
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
          >
            {cardinalityLabel}
          </text>
        )}

        {style.showCardinality && relationshipLabel && (
          <text
            x={midX}
            y={midY + 8}
            fill="#64748B" // CoolGray-500
            fontSize="10"
            fontStyle="italic"
            textAnchor="middle"
            style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
          >
            {relationshipLabel}
          </text>
        )}

        {/* Waypoint Handle */}
        {onUpdateWaypoints && waypointHandlePos && (
          <g onMouseDown={(e) => handleWaypointMouseDown(0, e)} style={{ cursor: 'move' }}>
            <ellipse
              cx={waypointHandlePos.x}
              cy={waypointHandlePos.y}
              rx="8"
              ry="6"
              fill="white"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <ellipse
              cx={waypointHandlePos.x}
              cy={waypointHandlePos.y}
              rx="4"
              ry="3"
              fill="#3b82f6"
            />
          </g>
        )}
      </g>
    );
  },
  // Memo function remains the same (omitted for brevity)
  (prevProps, nextProps) => {
    return (
      prevProps.sourceEntity.position === nextProps.sourceEntity.position &&
      prevProps.targetEntity.position === nextProps.targetEntity.position &&
      prevProps.sourceField.id === nextProps.sourceField.id &&
      prevProps.targetField.id === nextProps.targetField.id &&
      prevProps.externalWaypoints === nextProps.externalWaypoints &&
      prevProps.zoom === nextProps.zoom &&
      prevProps.panOffset === nextProps.panOffset
    );
  }
);