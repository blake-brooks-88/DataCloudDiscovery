import { Position } from 'reactflow';
import type { Entity } from '@shared/schema';

// --- Constants (Derived from EntityNode.tsx & Style Guide) ---
const NODE_WIDTH = 256;
const NODE_HEADER_HEIGHT = 48;
const METADATA_HEIGHT = 36;
// FIX: FIELD_ROW_HEIGHT must be 32 to match EntityNode.tsx for correct Y position calculation.
const FIELD_ROW_HEIGHT = 32;
const PADDING_TOP = NODE_HEADER_HEIGHT + METADATA_HEIGHT;

interface EdgePoint {
    x: number;
    y: number;
    position: Position; // Required to communicate the connected edge (Left, Right, Top, Bottom)
}

/**
 * Calculates the absolute pixel coordinates for a connection point on an entity node's edge.
 * It implements the logic from the project overview to ensure field-level precision.
 *
 * @param {Entity} entity - The entity object.
 * @param {string | undefined} fieldId - The ID of the field, or undefined for entity-level connection.
 * @param {Position} edgePosition - The required edge: Left, Right, Top, or Bottom.
 * @returns {EdgePoint} The calculated absolute x, y coordinates and the Position.
 */
const getAbsoluteEdgePoint = (entity: Entity, fieldId: string | undefined, edgePosition: Position): EdgePoint => {
    const entityX = entity.position?.x ?? 0;
    const entityY = entity.position?.y ?? 0;

    // 1. Determine Y-position (Vertical Alignment)
    let fieldYOffset = 0;
    if (fieldId) {
        // Find the index of the visible field
        const fieldIndex = entity.fields
            .filter(f => f.visibleInERD !== false)
            .findIndex(f => f.id === fieldId);

        if (fieldIndex !== -1) {
            // Case 1: Field-to-Field connection (Use precise field row center)
            // PADDING_TOP is the height of the header/metadata section above the first field.
            fieldYOffset = PADDING_TOP + (fieldIndex * FIELD_ROW_HEIGHT) + (FIELD_ROW_HEIGHT / 2);
        }
    }

    // Fallback for entity-level or when field not found: use vertical center of the visible fields.
    const visibleFieldsCount = entity.fields.slice(0, 4).length;
    // Calculate the center Y of the *field content* area.
    const centerOfVisibleContent = PADDING_TOP + (visibleFieldsCount * FIELD_ROW_HEIGHT) / 2;

    const y = entityY + (fieldId ? fieldYOffset : centerOfVisibleContent);

    // 2. Determine X-position (Left/Right/Center)
    let x = entityX;

    if (edgePosition === Position.Right) {
        x = entityX + NODE_WIDTH;
    } else if (edgePosition === Position.Top || edgePosition === Position.Bottom) {
        // Center of the node card
        x = entityX + NODE_WIDTH / 2;
    }
    // For Position.Left, x = entityX (left edge)

    return { x, y, position: edgePosition };
};


/**
 * Implements the Smart Edge Detection and Orthogonal (Manhattan) routing for all custom edges.
 *
 * @param {object} params - Parameters for path calculation.
 * @param {Entity} sourceEntity - The source entity object.
 * @param {Entity} targetEntity - The target entity object.
 * @param {string | undefined} sourceFieldId - Optional field ID on the source entity.
 * @param {string | undefined} targetFieldId - Optional field ID on the target entity.
 * @param {Array<{x: number, y: number}>} [waypoints] - Optional manual waypoints.
 * @returns {{path: string, sourcePoint: EdgePoint, targetPoint: EdgePoint}} The SVG path data string and calculated endpoints.
 */
export const getOrthogonalPath = ({
    sourceEntity,
    targetEntity,
    sourceFieldId,
    targetFieldId,
    waypoints = [],
}: {
    sourceEntity: Entity;
    targetEntity: Entity;
    sourceFieldId?: string;
    targetFieldId?: string;
    waypoints?: Array<{ x: number, y: number }>;
}): { path: string; sourcePoint: EdgePoint; targetPoint: EdgePoint } => {

    const sourceCenter = {
        x: (sourceEntity.position?.x ?? 0) + NODE_WIDTH / 2,
        y: (sourceEntity.position?.y ?? 0),
    };
    const targetCenter = {
        x: (targetEntity.position?.x ?? 0) + NODE_WIDTH / 2,
        y: (targetEntity.position?.y ?? 0),
    };

    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;

    let sourceEdge: Position;
    let targetEdge: Position;

    // --- 1. Smart Edge Detection (Project Overview Logic) ---
    if (Math.abs(dx) > Math.abs(dy)) {
        // Primarily horizontal flow
        sourceEdge = dx > 0 ? Position.Right : Position.Left;
        targetEdge = dx > 0 ? Position.Left : Position.Right;
    } else {
        // Primarily vertical flow
        sourceEdge = dy > 0 ? Position.Bottom : Position.Top;
        targetEdge = dy > 0 ? Position.Top : Position.Bottom;
    }

    // --- 2. Get Absolute Endpoints (Field-level precision applied to selected edge) ---
    const sourcePoint = getAbsoluteEdgePoint(sourceEntity, sourceFieldId, sourceEdge);
    const targetPoint = getAbsoluteEdgePoint(targetEntity, targetFieldId, targetEdge);

    const startX = sourcePoint.x;
    const startY = sourcePoint.y;
    const endX = targetPoint.x;
    const endY = targetPoint.y;

    // --- 3. Determine Path Points (Orthogonal Routing Logic with Waypoints) ---
    const pathPoints: [number, number][] = [];
    pathPoints.push([startX, startY]);

    if (waypoints.length > 0) {
        // Use manual waypoints if provided
        const wp = waypoints[0]; // Access first waypoint
        if (wp) {
            // Apply H-V-H logic based on the single waypoint
            // Assuming primary flow is horizontal for manual waypoints for now
            pathPoints.push([wp.x, startY]);
            pathPoints.push([wp.x, endY]);
        }
    } else {
        // Automatic orthogonal path (H-V-H or V-H-V based on flow)
        if (sourceEdge === Position.Left || sourceEdge === Position.Right) {
            // H-V-H path: Start horizontal, turn vertical
            const midX = startX + (endX - startX) / 2;
            pathPoints.push([midX, startY]);
            pathPoints.push([midX, endY]);
        } else {
            // V-H-V path: Start vertical, turn horizontal
            const midY = startY + (endY - startY) / 2;
            pathPoints.push([startX, midY]);
            pathPoints.push([endX, midY]);
        }
    }

    pathPoints.push([endX, endY]);

    // Convert array of points to SVG path string
    const path = pathPoints.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ');

    return { path, sourcePoint, targetPoint };
};