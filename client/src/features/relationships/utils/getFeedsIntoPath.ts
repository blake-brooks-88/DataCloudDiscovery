import { getSmoothStepPath, Position } from 'reactflow';
import type { Entity } from '@shared/schema';

// Constants for node size, must match EntityNode.tsx
const NODE_WIDTH = 256;
const NODE_HEIGHT = 120; // Approximation for average node height

/**
 * Calculates the orthogonal (H-V-H) path for entity-level connections, 
 * implementing Smart Edge Detection based on relative position.
 * * @param {Entity} sourceEntity - The source entity object.
 * @param {Entity} targetEntity - The target entity object.
 * @returns {string} The SVG path data string.
 */
export const getFeedsIntoPath = (sourceEntity: Entity, targetEntity: Entity): string => {
    const sX = (sourceEntity.position?.x ?? 0);
    const sY = (sourceEntity.position?.y ?? 0);
    const tX = (targetEntity.position?.x ?? 0);
    const tY = (targetEntity.position?.y ?? 0);

    const sCenter = { x: sX + NODE_WIDTH / 2, y: sY + NODE_HEIGHT / 2 };
    const tCenter = { x: tX + NODE_WIDTH / 2, y: tY + NODE_HEIGHT / 2 };

    const dx = tCenter.x - sCenter.x;
    const dy = tCenter.y - sCenter.y;

    let sourcePos: Position, targetPos: Position;
    let startX: number, startY: number, endX: number, endY: number;

    // 1. Smart Edge Detection (Determine connection edges based on proximity)
    if (Math.abs(dx) > Math.abs(dy)) {
        // Primarily horizontal flow
        if (dx > 0) {
            // Target is to the right
            sourcePos = Position.Right;
            targetPos = Position.Left;
        } else {
            // Target is to the left (Flipping the connection visually)
            sourcePos = Position.Left;
            targetPos = Position.Right;
        }
    } else {
        // Primarily vertical flow
        if (dy > 0) {
            // Target is below
            sourcePos = Position.Bottom;
            targetPos = Position.Top;
        } else {
            // Target is above
            sourcePos = Position.Top;
            targetPos = Position.Bottom;
        }
    }

    // 2. Set absolute start/end points based on determined position
    startX = sX + (sourcePos === Position.Right ? NODE_WIDTH : 0) + (sourcePos === Position.Left ? 0 : NODE_WIDTH / 2);
    startY = sY + (sourcePos === Position.Bottom ? NODE_HEIGHT : 0) + (sourcePos === Position.Top ? 0 : NODE_HEIGHT / 2);

    endX = tX + (targetPos === Position.Right ? NODE_WIDTH : 0) + (targetPos === Position.Left ? 0 : NODE_WIDTH / 2);
    endY = tY + (targetPos === Position.Bottom ? NODE_HEIGHT : 0) + (targetPos === Position.Top ? 0 : NODE_HEIGHT / 2);

    // 3. Use getSmoothStepPath to ensure orthogonal segments (React Flow utility)
    // This is a reliable way to get a Manhattan path without complex custom logic.
    // We pass the calculated start/end points and positions.
    return getSmoothStepPath({
        sourceX: startX,
        sourceY: startY,
        sourcePosition: sourcePos,
        targetX: endX,
        targetY: endY,
        targetPosition: targetPos,
    })[0];
};