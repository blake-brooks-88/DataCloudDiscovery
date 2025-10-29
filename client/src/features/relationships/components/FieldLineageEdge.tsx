import React from 'react';
import { EdgeProps } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
import type { Entity } from '@shared/schema';

interface CustomEdgeData {
  sourceEntity: Entity;
  targetEntity: Entity;
  sourceFieldId: string;
  targetFieldId: string;
  waypoints?: Array<{ x: number; y: number }>;
}

const FieldLineageEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  data,
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
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
    <g>
      {/* Base dashed line */}
      <path
        id={id}
        d={path}
        stroke="#BED163"
        strokeWidth={2}
        fill="none"
        strokeDasharray="8 4"
        strokeOpacity={0.6}
        markerEnd="url(#arrow-green)"
      />

      {/* Moving green dot along the path */}
      <circle r={2} fill="#BED163">
        <animateMotion dur="3s" repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
    </g>
  );
};

export default React.memo(FieldLineageEdge);
