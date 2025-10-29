import React from 'react';
import { EdgeProps } from 'reactflow'; // BaseEdge removed
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
import type { Entity } from '@shared/schema';

/**
 * @interface CustomEdgeData
 * @description Data structure for custom field-level edges.
 */
interface CustomEdgeData {
  sourceEntity: Entity;
  targetEntity: Entity;
  sourceFieldId: string;
  targetFieldId: string;
  waypoints?: Array<{ x: number; y: number }>;
}

/**
 * @component FieldLineageEdge
 * @description Custom edge for the 'maps-to' relationship, showing green dashed field-level lineage.
 * It uses orthogonal routing based on entity positions and field coordinates.
 */
const FieldLineageEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  data,
  id,
  sourceX, // <-- Use the prop from React Flow
  sourceY, // <-- Use the prop from React Flow
  targetX, // <-- Use the prop from React Flow
  targetY, // <-- Use the prop from React Flow
  sourcePosition, // <-- Use the prop from React Flow
  targetPosition, // <-- Use the prop from React Flow
}) => {
  if (!data) {
    return null;
  }

  // Call the new getOrthogonalPath with the live props
  const path = getOrthogonalPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    // We can still use waypoints from 'data' when we implement that
  });

  const style = {
    stroke: '#BED163',
    strokeWidth: 2,
    strokeDasharray: '8, 4',
    fill: 'none',
  };

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={path}
      style={style}
      strokeWidth={style.strokeWidth}
      fill={style.fill}
      markerEnd="url(#arrow-green)"
    />
  );
};

export default React.memo(FieldLineageEdge);
