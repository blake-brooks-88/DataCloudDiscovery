import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Entity, Field, Cardinality } from '@shared/schema';

/**
 * Props for the FieldLevelLine component.
 */
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

    const style = useMemo(
      () =>
        relationshipType === 'transforms-to'
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
            },
      [relationshipType]
    );

    const sourcePos = sourceEntity.position || { x: 100, y: 100 };
    const targetPos = targetEntity.position || { x: 400, y: 100 };

    const ENTITY_WIDTH = 320;
    const HEADER_HEIGHT = 52;
    const METADATA_HEIGHT = 36;
    const FIELD_HEIGHT = 28;
    const PADDING_TOP = HEADER_HEIGHT + METADATA_HEIGHT;
    const GRID_SIZE = 20;

    const sourceFieldIndex = useMemo(
      () =>
        sourceEntity.fields
          .filter((f) => f.visibleInERD !== false)
          .findIndex((f) => f.id === sourceField.id),
      [sourceEntity.fields, sourceField.id]
    );

    const sourceFieldY = useMemo(
      () => sourcePos.y + PADDING_TOP + sourceFieldIndex * FIELD_HEIGHT + FIELD_HEIGHT / 2,
      [sourcePos.y, sourceFieldIndex, PADDING_TOP]
    );

    const targetFieldIndex = useMemo(
      () =>
        targetEntity.fields
          .filter((f) => f.visibleInERD !== false)
          .findIndex((f) => f.id === targetField.id),
      [targetEntity.fields, targetField.id]
    );

    const targetFieldY = useMemo(
      () => targetPos.y + PADDING_TOP + targetFieldIndex * FIELD_HEIGHT + FIELD_HEIGHT / 2,
      [targetPos.y, targetFieldIndex, PADDING_TOP]
    );

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

    const waypoints = useMemo(
      () => externalWaypoints || sourceField.fkReference?.waypoints || [],
      [externalWaypoints, sourceField.fkReference]
    );

    const createPath = useCallback(() => {
      if (waypoints.length === 0) {
        const midX = (startX + endX) / 2;
        return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
      } else if (waypoints.length === 1) {
        const wp = waypoints[0];
        if (!wp) {
          return '';
        }
        return `M ${startX} ${startY} L ${wp.x} ${startY} L ${wp.x} ${endY} L ${endX} ${endY}`;
      } else {
        const wp1 = waypoints[0];
        const wp2 = waypoints[1];
        if (!wp1 || !wp2) {
          return '';
        }
        return `M ${startX} ${startY} L ${wp1.x} ${startY} L ${wp2.x} ${endY} L ${endX} ${endY}`;
      }
    }, [startX, startY, endX, endY, waypoints]);

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
        const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;

        onUpdateWaypoints(sourceField.id, [
          { x: snappedX, y: startY },
          { x: snappedX, y: endY },
        ]);
      },
      [draggedWaypointIndex, onUpdateWaypoints, panOffset.x, zoom, sourceField.id, startY, endY]
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

    const drawStartMarker = useCallback(() => {
      if (!style.showCardinality) {
        return null;
      }
      const markerSize = 12;
      const markerColor = style.stroke;
      if (cardinality === 'one-to-one' || cardinality === 'one-to-many') {
        return (
          <line
            x1={startX}
            y1={startY - markerSize / 2}
            x2={startX}
            y2={startY + markerSize / 2}
            stroke={markerColor}
            strokeWidth="2"
          />
        );
      } else {
        return (
          <g>
            <line
              x1={startX}
              y1={startY}
              x2={startX + markerSize}
              y2={startY - markerSize / 2}
              stroke={markerColor}
              strokeWidth="2"
            />
            <line
              x1={startX}
              y1={startY}
              x2={startX + markerSize}
              y2={startY}
              stroke={markerColor}
              strokeWidth="2"
            />
            <line
              x1={startX}
              y1={startY}
              x2={startX + markerSize}
              y2={startY + markerSize / 2}
              stroke={markerColor}
              strokeWidth="2"
            />
          </g>
        );
      }
    }, [style.showCardinality, style.stroke, cardinality, startX, startY]);

    const drawEndMarker = useCallback(() => {
      if (!style.showCardinality) {
        return null;
      }
      const markerSize = 12;
      const markerColor = style.stroke;
      if (cardinality === 'one-to-one' || cardinality === 'many-to-one') {
        return (
          <line
            x1={endX}
            y1={endY - markerSize / 2}
            x2={endX}
            y2={endY + markerSize / 2}
            stroke={markerColor}
            strokeWidth="2"
          />
        );
      } else {
        return (
          <g>
            <line
              x1={endX}
              y1={endY}
              x2={endX - markerSize}
              y2={endY - markerSize / 2}
              stroke={markerColor}
              strokeWidth="2"
            />
            <line
              x1={endX}
              y1={endY}
              x2={endX - markerSize}
              y2={endY}
              stroke={markerColor}
              strokeWidth="2"
            />
            <line
              x1={endX}
              y1={endY}
              x2={endX - markerSize}
              y2={endY + markerSize / 2}
              stroke={markerColor}
              strokeWidth="2"
            />
          </g>
        );
      }
    }, [style.showCardinality, style.stroke, cardinality, endX, endY]);

    const firstWaypoint = useMemo(() => waypoints[Math.floor(waypoints.length / 2)], [waypoints]);
    const midX = useMemo(
      () => (waypoints.length > 0 && firstWaypoint ? firstWaypoint.x : (startX + endX) / 2),
      [waypoints, firstWaypoint, startX, endX]
    );
    const midY = useMemo(
      () => (waypoints.length > 0 && firstWaypoint ? firstWaypoint.y : (startY + endY) / 2),
      [waypoints, firstWaypoint, startY, endY]
    );

    const waypointHandlePos = useMemo(() => waypoints[0], [waypoints]);

    return (
      <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <path
          d={pathData}
          stroke="transparent"
          strokeWidth="12"
          fill="none"
          style={{ pointerEvents: 'stroke' }}
        />
        <path
          d={pathData}
          stroke={isHovered ? '#3b82f6' : style.stroke}
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
            style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
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
            style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
          >
            {relationshipLabel}
          </text>
        )}

        {onUpdateWaypoints && waypointHandlePos && (
          <g onMouseDown={(e) => handleWaypointMouseDown(0, e)} style={{ cursor: 'ew-resize' }}>
            <ellipse
              cx={waypointHandlePos.x}
              cy={(startY + endY) / 2}
              rx="8"
              ry="6"
              fill="white"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <ellipse
              cx={waypointHandlePos.x}
              cy={(startY + endY) / 2}
              rx="4"
              ry="3"
              fill="#3b82f6"
            />
          </g>
        )}
      </g>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if positions, field IDs, or waypoints change
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
