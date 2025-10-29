import type { Entity, Relationship } from '@shared/schema';
import { Node, Edge } from 'reactflow';
import type { GraphViewProps } from '../components/GraphView';
import type { FieldMapping } from '@shared/schema';
// CRITICAL FIX: Add the missing import for the orthogonal path utility
import { getOrthogonalPath } from '../../relationships/utils/getOrthogonalPath';


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
    onGenerateDMO?: GraphViewProps['onEntityDoubleClick']
): Node<EntityNodeData>[] => {
    return entities.map((entity) => ({
        id: entity.id,
        type: 'entity', // Maps to the custom node type registered in GraphView
        position: {
            x: entity.position?.x ?? 0,
            y: entity.position?.y ?? 0,
        },
        data: {
            entity: entity,
            onDoubleClick: onEntityDoubleClick,
            onGenerateDLO,
            onGenerateDMO,
        },
    }));
};

/**
 * @function mapRelationshipsToEdges
 * @description Converts all domain-specific data (Relationships & Field Mappings) into React Flow Edges.
 * @param {Relationship[]} relationships - The core domain relationship objects (mostly for feeds-into).
 * @param {Entity[]} entities - All entities to resolve field positions for lineage and FKs.
 * @returns {Edge[]} The array of React Flow Edges.
 */
export const mapRelationshipsToEdges = (relationships: Relationship[], entities: Entity[]): Edge[] => {
    const edges: Edge[] = [];

    // 1. Process Field-Level Lineage (maps-to) from DMOs
    entities.forEach((targetEntity) => {
        if (targetEntity.fieldMappings && targetEntity.fieldMappings.length > 0) {
            targetEntity.fieldMappings.forEach((mapping: FieldMapping, index) => {
                const sourceEntity = entities.find(e => e.id === mapping.sourceEntityId);

                if (sourceEntity) {
                    edges.push({
                        id: `edge-map-${targetEntity.id}-${mapping.targetFieldId}-${index}`,
                        source: mapping.sourceEntityId,
                        target: targetEntity.id,
                        // FIX APPLIED HERE: Data source (DLO field) must connect to a SOURCE handle
                        sourceHandle: `field-source-${mapping.sourceFieldId}`,
                        targetHandle: `field-target-${mapping.targetFieldId}`, // Target (DMO field) is always an input target handle
                        type: 'field-lineage', // Maps to FieldLineageEdge.tsx
                        data: {
                            sourceEntity,
                            targetEntity,
                            sourceFieldId: mapping.sourceFieldId,
                            targetFieldId: mapping.targetFieldId,
                            waypoints: mapping.waypoints,
                        },
                    });
                }
            });
        }
    });

    // 2. Process Field-Level FK References (references) from FK fields
    entities.forEach((sourceEntity) => {
        sourceEntity.fields.forEach(field => {
            if (field.isFK && field.fkReference) {
                const targetEntity = entities.find(e => e.id === field.fkReference!.targetEntityId);

                if (targetEntity) {
                    edges.push({
                        id: `edge-fk-${sourceEntity.id}-${field.id}`,
                        source: sourceEntity.id,
                        target: targetEntity.id,
                        sourceHandle: `field-source-${field.id}`, // Connects from the FK field's handle (source)
                        targetHandle: `field-target-${field.fkReference!.targetFieldId}`, // Connects to the PK field's handle (target)
                        type: 'fk-reference', // Maps to FKReferenceEdge.tsx
                        data: {
                            sourceEntity,
                            targetEntity,
                            sourceFieldId: field.id,
                            targetFieldId: field.fkReference!.targetFieldId,
                            cardinality: field.fkReference!.cardinality,
                            waypoints: field.fkReference!.waypoints,
                        },
                    });
                }
            }
        });
    });


    // 3. Process Entity-Level Relationships (feeds-into)
    relationships.filter(rel => rel.type === 'feeds-into').forEach((rel) => {
        const sourceEntity = entities.find(e => e.id === rel.sourceEntityId);
        const targetEntity = entities.find(e => e.id === rel.targetEntityId);

        if (sourceEntity && targetEntity) {
            edges.push({
                id: `e-${rel.sourceEntityId}-${rel.targetEntityId}`,
                source: rel.sourceEntityId,
                target: rel.targetEntityId,
                // CRITICAL FIX: Ensure the correct type is set for the custom edge
                type: 'feeds-into',
                markerEnd: 'url(#arrow-blue-solid)',
                // Pass entities so FeedsIntoEdge can calculate orthogonal path
                data: {
                    sourceEntity,
                    targetEntity,
                }
            });
        }
    });

    return edges;
};
