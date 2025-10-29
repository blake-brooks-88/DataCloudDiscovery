import React from 'react';
import { EdgeProps } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
import type { Entity } from '@shared/schema';

interface CustomEdgeData {
  sourceEntity: Entity;
  targetEntity: Entity;
  waypoints?: Array<{ x: number; y: number }>;
}

const TransformsToEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  if (!data) {
    return null;
  }

  const path = getOrthogonalPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      {/* Thicker “mega” base line */}
      <path
        d={path}
        stroke="#A7B957"
        strokeWidth={6} // increased from 4
        fill="none"
        opacity={0.3} // slightly more visible
      />

      {/* Dotted/animated line representing 1:1 field mappings */}
      <path
        d={path}
        stroke="#BED163"
        strokeWidth={3}
        fill="none"
        strokeDasharray="5 6"
        markerEnd="url(#arrow-green)"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="8"
          to="0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
    </>
  );
};

export default React.memo(TransformsToEdge);
