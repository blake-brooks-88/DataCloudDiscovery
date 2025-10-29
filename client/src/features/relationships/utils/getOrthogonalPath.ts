import { Position } from 'reactflow';

/**
 * Calculates an Orthogonal (Manhattan) path based on the final, calculated
 * coordinates provided by React Flow.
 *
 * It prioritizes horizontal (Right-to-Left or Left-to-Right) connections
 * when nodes are positioned more horizontally than vertically relative to each other.
 *
 * @param {object} params - Parameters including coordinates and optional handle positions.
 * @param {number} params.sourceX - The x-coordinate of the source handle.
 * @param {number} params.sourceY - The y-coordinate of the source handle.
 * @param {number} params.targetX - The x-coordinate of the target handle.
 * @param {number} params.targetY - The y-coordinate of the target handle.
 * @param {Position} [params.sourcePosition] - Optional: The side of the source node (used by React Flow for context).
 * @param {Position} [params.targetPosition] - Optional: The side of the target node (used by React Flow for context).
 * @returns {string} The SVG path data string 'd'.
 */
export const getOrthogonalPath = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
}): string => {
  const pathPoints: [number, number][] = [];
  pathPoints.push([sourceX, sourceY]);

  // --- Smart Routing Logic ---
  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);

  // Determine primary flow direction
  const isHorizontalFlow = dx > dy;

  if (isHorizontalFlow) {
    // Force H-V-H path for primarily horizontal arrangements
    const midX = sourceX + (targetX - sourceX) / 2;
    pathPoints.push([midX, sourceY]); // Horizontal segment
    pathPoints.push([midX, targetY]); // Vertical segment
  } else {
    // Force V-H-V path for primarily vertical arrangements (or perfectly diagonal)
    const midY = sourceY + (targetY - sourceY) / 2;
    pathPoints.push([sourceX, midY]); // Vertical segment
    pathPoints.push([targetX, midY]); // Horizontal segment
  }
  // --- End Smart Routing Logic ---

  pathPoints.push([targetX, targetY]); // Final point

  // Convert array of points to SVG path string
  const path = pathPoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`)
    .join(' ');

  return path;
};
