import React from 'react';
import { EdgeProps } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
import type { Entity } from '@shared/schema';

interface CustomEdgeData {
  sourceEntity: Entity;
  targetEntity: Entity;
  waypoints?: Array<{ x: number; y: number }>;
}

/**
 * @component TransformsToEdge
 * @description Custom edge for the 'transforms-to' 1:1 shorthand (DLO -> DMO).
 * It renders as a solid green line.
 */
const TransformsToEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data, // We still have the data prop, even if not used for path calc
}) => {
  if (!data) {
    return null;
  }

  // Use the live props from React Flow, not the stale data from the data prop,
  // to calculate the path. This ensures the line moves when nodes are dragged.
  const path = getOrthogonalPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Green Solid Line - Tertiary-Green/Accent
  const style = {
    stroke: '#BED163',
    strokeWidth: 2,
    fill: 'none',
  };

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={path}
      style={style}
      markerEnd="url(#arrow-green)"
    />
  );
};

export default React.memo(TransformsToEdge);
