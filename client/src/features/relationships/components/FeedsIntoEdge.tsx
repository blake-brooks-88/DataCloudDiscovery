import React from 'react';
import { EdgeProps } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
import type { Entity } from '@shared/schema';

interface CustomEdgeData {
  sourceEntity: Entity;
  targetEntity: Entity;
  waypoints?: Array<{ x: number; y: number }>;
}

const FeedsIntoEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  data,
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
      <path id={id} d={path} stroke="#4AA0D9" strokeWidth={3} fill="none" strokeOpacity="0.7" />
      <circle r="4" fill="#4AA0D9">
        <animateMotion dur="2s" repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
    </g>
  );
};

export default React.memo(FeedsIntoEdge);
