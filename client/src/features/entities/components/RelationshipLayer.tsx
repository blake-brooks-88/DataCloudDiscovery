import type { Entity, Relationship } from '@shared/schema';
import { EntityLevelLine, FieldLevelLine } from '@/features/relationships';

/**
 * Props for the RelationshipLayer component.
 */
export interface RelationshipLayerProps {
  /** All entities in the project */
  entities: Entity[];
  /** All relationships in the project */
  relationships: Relationship[];
  /** Current canvas zoom level */
  zoom: number;
  /** Current canvas pan offset */
  panOffset: { x: number; y: number };
  /** Callback when relationship waypoints are updated */
  onUpdateRelationshipWaypoints: (
    entityId: string,
    fieldId: string,
    waypoints: { x: number; y: number }[]
  ) => void;
}

/**
 * SVG layer that renders all relationship lines between entities.
 * Handles three types of relationships:
 * 1. Entity-level 'feeds-into' lines (Data Stream → DLO)
 * 2. Field-level 'transforms-to' lines (DLO → DMO field mappings)
 * 3. Field-level 'references' lines (DMO → DMO foreign key relationships)
 *
 * @param {RelationshipLayerProps} props - Component props
 * @returns {JSX.Element}
 */
export function RelationshipLayer({
  entities,
  relationships,
  zoom,
  panOffset,
  onUpdateRelationshipWaypoints,
}: RelationshipLayerProps) {
  const lines: JSX.Element[] = [];

  // 1. Entity-level lines (feeds-into: Data Stream → DLO)
  relationships
    .filter((rel) => rel.type === 'feeds-into')
    .forEach((rel) => {
      const sourceEntity = entities.find((e) => e.id === rel.sourceEntityId);
      const targetEntity = entities.find((e) => e.id === rel.targetEntityId);

      if (!sourceEntity || !targetEntity) {
        return;
      }

      lines.push(
        <EntityLevelLine
          key={rel.id}
          relationship={rel}
          sourceEntity={sourceEntity}
          targetEntity={targetEntity}
          zoom={zoom}
          panOffset={panOffset}
        />
      );
    });

  // 2. Field-level lines (transforms-to: DLO → DMO OR DMO → DMO)
  relationships
    .filter((rel) => rel.type === 'transforms-to')
    .forEach((rel) => {
      const sourceEntity = entities.find((e) => e.id === rel.sourceEntityId);
      const targetEntity = entities.find((e) => e.id === rel.targetEntityId);

      if (!sourceEntity || !targetEntity) {
        return;
      }

      // Field mappings can be defined on the relationship OR on the target entity
      const mappings =
        rel.fieldMappings ||
        targetEntity.fieldMappings?.filter((fm) => fm.sourceEntityId === sourceEntity.id) ||
        [];

      mappings.forEach((mapping) => {
        const sourceField = sourceEntity.fields.find((f) => f.id === mapping.sourceFieldId);
        const targetField = targetEntity.fields.find((f) => f.id === mapping.targetFieldId);

        if (!sourceField || !targetField) {
          return;
        }

        lines.push(
          <FieldLevelLine
            key={`${rel.id}-${mapping.targetFieldId}`}
            sourceEntity={sourceEntity}
            targetEntity={targetEntity}
            sourceField={sourceField}
            targetField={targetField}
            relationshipType="transforms-to"
            zoom={zoom}
            panOffset={panOffset}
          />
        );
      });
    });

  // 3. Field-level lines (references: DMO → DMO FK relationships)
  entities.forEach((entity) => {
    entity.fields
      .filter((f) => f.isFK && f.fkReference && f.visibleInERD !== false)
      .forEach((field) => {
        const { fkReference } = field;
        if (!fkReference) {
          return;
        }

        const targetEntity = entities.find((e) => e.id === fkReference.targetEntityId);
        const targetField = targetEntity?.fields.find((f) => f.id === fkReference.targetFieldId);

        if (!targetEntity || !targetField) {
          return;
        }

        lines.push(
          <FieldLevelLine
            key={`${entity.id}-${field.id}`}
            sourceEntity={entity}
            targetEntity={targetEntity}
            sourceField={field}
            targetField={targetField}
            relationshipType="references"
            cardinality={fkReference.cardinality}
            relationshipLabel={fkReference.relationshipLabel}
            externalWaypoints={fkReference.waypoints}
            zoom={zoom}
            panOffset={panOffset}
            onUpdateWaypoints={(fieldId, waypoints) =>
              onUpdateRelationshipWaypoints(entity.id, fieldId, waypoints)
            }
          />
        );
      });
  });

  return (
    <svg
      className="absolute inset-0"
      style={{
        zIndex: 1,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Arrow markers for 'feeds-into' */}
        <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#4AA0D9" />
        </marker>

        {/* Arrow markers for 'transforms-to' (unused, kept for consistency) */}
        <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#BED163" />
        </marker>

        {/* Animated data flow pattern for 'feeds-into' */}
        <pattern
          id="data-flow-pattern"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="10" r="2" fill="#4AA0D9" opacity="0.6">
            <animate attributeName="cx" from="5" to="25" dur="2s" repeatCount="indefinite" />
          </circle>
        </pattern>

        {/* Crow's foot notation markers for 'references' relationships */}
        <marker id="cf-one" markerWidth="16" markerHeight="16" refX="8" refY="8" orient="auto">
          <line x1="8" y1="4" x2="8" y2="12" stroke="#64748B" strokeWidth="2" />
        </marker>
        <marker id="cf-many" markerWidth="16" markerHeight="16" refX="8" refY="8" orient="auto">
          <line x1="8" y1="8" x2="2" y2="4" stroke="#64748B" strokeWidth="2" />
          <line x1="8" y1="8" x2="2" y2="8" stroke="#64748B" strokeWidth="2" />
          <line x1="8" y1="8" x2="2" y2="12" stroke="#64748B" strokeWidth="2" />
        </marker>
      </defs>

      <g
        transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}
        style={{ pointerEvents: 'auto' }}
      >
        {lines}
      </g>
    </svg>
  );
}
