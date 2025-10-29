import React from 'react';
// Import Position, as it's a required prop
import { EdgeProps } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
import type { Entity } from '@shared/schema';

interface CustomEdgeData {
  sourceEntity: Entity;
  targetEntity: Entity;
  waypoints?: Array<{ x: number; y: number }>;
}

/**
 * @component FeedsIntoEdge
 * @description Custom edge for the 'feeds-into' relationship (Data Stream -> DLO).
 * It renders as a solid blue line with an animated flow.
 */
const FeedsIntoEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
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

  // Use the live props from React Flow, not the stale data prop,
  // to calculate the path. This ensures the line moves when nodes are dragged.
  const path = getOrthogonalPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Style (Blue, 4px, solid) - Secondary-Blue
  const style = {
    stroke: '#4AA0D9',
    strokeWidth: 4,
    fill: 'none',
  };

  // Animated portion (renders on top of the solid line)
  const animatedStyle = {
    ...style,
    strokeWidth: 4,
    stroke: 'url(#data-flow-pattern)',
  };

  return (
    <>
      <path id={id} className="react-flow__edge-path" d={path} style={style} />
      <path
        id={`${id}-animated`}
        className="react-flow__edge-path"
        d={path}
        style={animatedStyle}
      />
    </>
  );
};

export default React.memo(FeedsIntoEdge);
