import { Position } from 'reactflow';

/**
 * Calculates an Orthogonal (Manhattan) path based on the final, calculated
 * coordinates and handle positions provided by React Flow.
 *
 * @param {number} sourceX - The x-coordinate of the source handle.
 * @param {number} sourceY - The y-coordinate of the source handle.
 * @param {number} targetX - The x-coordinate of the target handle.
 * @param {number} targetY - The y-coordinate of the target handle.
 * @param {Position} sourcePosition - The side of the node the source handle is on (e.g., 'right').
 * @param {Position} targetPosition - The side of the node the target handle is on (e.g., 'left').
 * @returns {string} The SVG path data string.
 */
export const getOrthogonalPath = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  // targetPosition = Position.Left,
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

  // Logic for automatic H-V-H or V-H-V path
  if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
    // H-V-H path: Start horizontal, turn vertical
    const midX = sourceX + (targetX - sourceX) / 2;
    pathPoints.push([midX, sourceY]);
    pathPoints.push([midX, targetY]);
  } else {
    // V-H-V path: Start vertical, turn horizontal
    const midY = sourceY + (targetY - sourceY) / 2;
    pathPoints.push([sourceX, midY]);
    pathPoints.push([targetX, midY]);
  }

  pathPoints.push([targetX, targetY]);

  // Convert array of points to SVG path string
  const path = pathPoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`)
    .join(' ');

  return path;
};
