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
    waypoints?: Array<{ x: number, y: number }>;
}

/**
 * @component FieldLineageEdge
 * @description Custom edge for the 'maps-to' relationship, showing green dashed field-level lineage.
 * It uses orthogonal routing based on entity positions and field coordinates.
 */
const FieldLineageEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
    data, // Contains sourceEntity, targetEntity, etc.
    id,
    // CRITICAL: We accept all required React Flow props (even if not used for path calc)
    // sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
}) => {
    if (!data) return null;

    // FIX: Destructure the 'path' string directly from the returned object.
    const { path } = getOrthogonalPath({
        sourceEntity: data.sourceEntity,
        targetEntity: data.targetEntity,
        sourceFieldId: data.sourceFieldId,
        targetFieldId: data.targetFieldId,
        waypoints: data.waypoints,
    });

    // Green Dashed Line (maps-to) - Tertiary-Green/Accent
    const style = {
        stroke: '#BED163',
        strokeWidth: 2,
        strokeDasharray: '8, 4',
        fill: 'none',
    };

    // FIX: Render the <path> directly instead of using BaseEdge to prevent path overriding.
    return (
        <path
            id={id}
            className="react-flow__edge-path" // Apply React Flow class for default behavior
            d={path} // Our calculated orthogonal path data
            style={style}
            strokeWidth={style.strokeWidth}
            fill={style.fill}
            // Add the green arrow marker for lineage
            markerEnd="url(#arrow-green)"
        />
    );
};

export default React.memo(FieldLineageEdge);