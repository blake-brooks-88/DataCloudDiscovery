import type { Relationship, Entity } from "@shared/schema";

export interface EntityLevelLineProps {
  relationship: Relationship;
  sourceEntity: Entity;
  targetEntity: Entity;
  zoom: number;
  panOffset: { x: number; y: number };
}

export default function EntityLevelLine({
  relationship,
  sourceEntity,
  targetEntity,
  zoom,
  panOffset,
}: EntityLevelLineProps) {
  const sourcePos = sourceEntity.position || { x: 100, y: 100 };
  const targetPos = targetEntity.position || { x: 400, y: 100 };

  const ENTITY_WIDTH = 320;
  const ENTITY_HEIGHT = 150;

  const startX = sourcePos.x + ENTITY_WIDTH;
  const startY = sourcePos.y + ENTITY_HEIGHT / 2;
  const endX = targetPos.x;
  const endY = targetPos.y + ENTITY_HEIGHT / 2;

  const midX = (startX + endX) / 2;
  const pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;

  return (
    <g>
      <path
        d={pathData}
        stroke="#4AA0D9"
        strokeWidth="4"
        fill="none"
        markerEnd="url(#arrow-blue)"
      />

      <path
        d={pathData}
        stroke="url(#data-flow-pattern)"
        strokeWidth="4"
        fill="none"
        style={{ pointerEvents: 'none' }}
      />

      <text
        x={midX}
        y={(startY + endY) / 2 - 8}
        fill="#4AA0D9"
        fontSize="11"
        fontWeight="600"
        textAnchor="middle"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {relationship.label || 'Ingests'}
      </text>
    </g>
  );
}
