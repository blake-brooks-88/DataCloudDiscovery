import type { Entity, Relationship } from '@shared/schema';
import { Node, Edge } from 'reactflow';
import type { GraphViewProps } from '../components/GraphView';

/**
 * @interface EntityNodeData
 * @description Interface that defines the custom data passed via the 'data' field
 * in the React Flow Node object, used by EntityNode.tsx.
 */
export interface EntityNodeData {
  entity: Entity;
  onDoubleClick: GraphViewProps['onEntityDoubleClick'];
  onGenerateDLO?: GraphViewProps['onGenerateDLO'];
  onGenerateDMO?: GraphViewProps['onGenerateDMO'];
  isSearchMatch?: boolean;
  dimmed?: boolean;
}

/**
 * @function mapEntitiesToNodes
 * @description Converts the domain-specific Entity array into the structure required by React Flow Nodes.
 * @param {Entity[]} entities - The core domain entity objects from storage.
 * @param {GraphViewProps['onEntityDoubleClick']} onEntityDoubleClick - Handler for entity double-click.
 * @returns {Node<EntityNodeData>[]} The array of React Flow Nodes.
 */
export const mapEntitiesToNodes = (
  entities: Entity[],
  onEntityDoubleClick: GraphViewProps['onEntityDoubleClick'],
  onGenerateDLO?: GraphViewProps['onGenerateDLO'],
  onGenerateDMO?: GraphViewProps['onGenerateDMO']
): Node<EntityNodeData>[] => {
  return entities.map((entity) => ({
    id: entity.id,
    type: 'entity',
    position: {
      x: entity.position?.x ?? 0,
      y: entity.position?.y ?? 0,
    },
    data: {
      entity: entity,
      onDoubleClick: onEntityDoubleClick,
      onGenerateDLO,
      onGenerateDMO,
      isSearchMatch: false,
      dimmed: false,
    },
  }));
};

/**
 * @function mapRelationshipsToEdges
 * @description Converts all domain data (relationships and entities) into React Flow Edges.
 * Handles 4 types of connections.
 * @param {Relationship[]} relationships - The core domain relationship objects.
 * @param {Entity[]} entities - The core domain entity objects.
 * @returns {Edge[]} The array of React Flow Edges.
 */
export const mapRelationshipsToEdges = (
  relationships: Relationship[],
  entities: Entity[]
): Edge[] => {
  const edges: Edge[] = [];
  const shorthandDmoIds = new Set<string>();

  // --- First Pass: Process Entity-Level Relationships ---
  for (const rel of relationships) {
    const sourceEntity = entities.find((e) => e.id === rel.sourceEntityId);
    const targetEntity = entities.find((e) => e.id === rel.targetEntityId);

    if (!sourceEntity || !targetEntity) {
      continue;
    }

    if (rel.type === 'feeds-into') {
      edges.push({
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        type: 'feeds-into',
        sourceHandle: 'entity-source',
        targetHandle: 'entity-target',
        data: {
          sourceEntity,
          targetEntity,
        },
      });
    }

    if (rel.type === 'transforms-to') {
      shorthandDmoIds.add(rel.targetEntityId);

      edges.push({
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        type: 'transforms-to',
        sourceHandle: 'entity-source',
        targetHandle: 'entity-target',
        data: {
          sourceEntity,
          targetEntity,
        },
      });
    }
  }

  // --- Second Pass: Process Field-Level Connections ---
  for (const entity of entities) {
    // 1. Generate 'references' (Foreign Key) edges
    for (const field of entity.fields) {
      const { fkReference } = field;

      if (field.isFK && fkReference) {
        const targetEntity = entities.find((e) => e.id === fkReference.targetEntityId);
        const targetField = targetEntity?.fields.find((f) => f.id === fkReference.targetFieldId);

        if (targetEntity && targetField) {
          edges.push({
            id: `fk-${entity.id}:${field.id}-${fkReference.targetEntityId}:${fkReference.targetFieldId}`,
            source: entity.id,
            target: targetEntity.id,
            type: 'fk-reference',
            sourceHandle: `field-source-${field.id}`,
            targetHandle: `field-target-${targetField.id}`,
            data: {
              sourceEntity: entity,
              targetEntity: targetEntity,
              sourceFieldId: field.id,
              targetFieldId: targetField.id,
              cardinality: fkReference.cardinality,
              waypoints: fkReference.waypoints,
            },
          });
        }
      }
    }

    // 2. Generate 'maps-to' (Field Lineage) edges
    if (entity.type === 'dmo' && !shorthandDmoIds.has(entity.id)) {
      if (entity.fieldMappings && entity.fieldMappings.length > 0) {
        for (const mapping of entity.fieldMappings) {
          const sourceEntity = entities.find((e) => e.id === mapping.sourceEntityId);
          const sourceField = sourceEntity?.fields.find((f) => f.id === mapping.sourceFieldId);

          if (sourceEntity && sourceField) {
            edges.push({
              id: `map-${mapping.sourceEntityId}:${mapping.sourceFieldId}-${entity.id}:${mapping.targetFieldId}`,
              source: sourceEntity.id,
              target: entity.id,
              type: 'field-lineage',
              sourceHandle: `field-source-${sourceField.id}`,
              targetHandle: `field-target-${mapping.targetFieldId}`,
              data: {
                sourceEntity: sourceEntity,
                targetEntity: entity,
                sourceFieldId: sourceField.id,
                targetFieldId: mapping.targetFieldId,
                waypoints: mapping.waypoints,
              },
            });
          }
        }
      }
    }
  }

  return edges;
};
