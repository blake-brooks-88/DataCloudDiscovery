import React from 'react';
import { BaseEdge, EdgeProps } from 'reactflow';
import { getOrthogonalPath } from '../utils/getOrthogonalPath';
// FIX: Import the necessary types
import type { Cardinality, Entity } from '@shared/schema';

/**
 * @interface CustomEdgeData
 * @description Data structure for custom field-level edges. Copied for local clarity.
 */
interface CustomEdgeData {
    sourceEntity: Entity;
    targetEntity: Entity;
    sourceFieldId: string;
    targetFieldId: string;
    waypoints?: Array<{ x: number, y: number }>;
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
}) => {
    if (!data) { return null };

    // FIX: Destructure the 'path' string directly from the returned object.
    const { path } = getOrthogonalPath({
        sourceEntity: data.sourceEntity,
        targetEntity: data.targetEntity,
        sourceFieldId: data.sourceFieldId,
        targetFieldId: data.targetFieldId,
        waypoints: data.waypoints,
    });

    // Determine markers based on cardinality
    let markerStartId: string;
    let markerEndId: string;

    // Crow's Foot Notation:
    // Source side is the foreign key (FK) end
    // Target side is the primary key (PK) end

    switch (data.cardinality) {
        case 'one-to-one':
            // One on both sides
            markerStartId = 'cf-one';
            markerEndId = 'cf-one';
            break;
        case 'one-to-many':
            // Source (FK) is 'many', Target (PK) is 'one' (Standard notation for FK to PK relationship)
            markerStartId = 'cf-many';
            markerEndId = 'cf-one';
            break;
        case 'many-to-one':
            // Source (FK) is 'many', Target (PK) is 'one' (This naming is misleading, but we assume it means Source:Many, Target:One)
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
            // NOTE: Markers are hardcoded for now, but should be dynamic based on the calculated edge position (Left/Right/Top/Bottom)
            // The dynamic marker logic is a future enhancement to ensure markers are always perpendicular to the node.
            markerStart={`url(#${markerStartId})`}
            markerEnd={`url(#${markerEndId})`}
        />
    );
};

export default React.memo(FKReferenceEdge);