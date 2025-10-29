import React from 'react';
import { BaseEdge, EdgeProps } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
import type { Cardinality, Entity } from '@shared/schema';

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
 * @interface FKEdgeData
 * @description Data structure for the FK reference edge. Extends CustomEdgeData.
 */
interface FKEdgeData extends CustomEdgeData {
  cardinality: Cardinality;
}

/**
 * @component FKReferenceEdge
 * @description Custom edge for the 'references' relationship, showing solid gray crow's foot FKs.
 * It uses orthogonal routing and dynamic markers for cardinality.
 */
const FKReferenceEdge: React.FC<EdgeProps<FKEdgeData>> = ({
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

  // Use the live props from React Flow to calculate the path.
  // This ensures the line moves when nodes are dragged.
  const path = getOrthogonalPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    // We could pass data.waypoints here in the future
  });

  // Determine markers based on cardinality
  let markerStartId: string;
  let markerEndId: string;

  // Crow's Foot Notation:
  // Source side is the foreign key (FK) end
  // Target side is the primary key (PK) end

  switch (data.cardinality) {
    case 'one-to-one':
      markerStartId = 'cf-one';
      markerEndId = 'cf-one';
      break;
    case 'one-to-many':
      markerStartId = 'cf-many';
      markerEndId = 'cf-one';
      break;
    case 'many-to-one':
      markerStartId = 'cf-many';
      markerEndId = 'cf-one';
      break;
    default:
      markerStartId = '';
      markerEndId = '';
  }

  // The 'references' relationship uses a solid gray line (CoolGray-500)
  const style = {
    stroke: '#64748B',
    strokeWidth: 2,
    fill: 'none',
  };

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerStart={`url(#${markerStartId})`}
      markerEnd={`url(#${markerEndId})`}
    />
  );
};

export default React.memo(FKReferenceEdge);
