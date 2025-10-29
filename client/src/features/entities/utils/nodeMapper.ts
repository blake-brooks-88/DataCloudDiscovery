// src/features/entities/utils/nodeMapper.ts

import type { Entity, Relationship } from '@shared/schema';
import { Node, Edge, MarkerType } from 'reactflow';
// Importing the props type directly from GraphView for clean typing of the callback
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
        type: 'entity', // Maps to the custom node type registered in GraphView
        position: {
            // Ensure fallbacks for position
            x: entity.position?.x ?? 0,
            y: entity.position?.y ?? 0,
        },
        data: {
            entity: entity,
            onDoubleClick: onEntityDoubleClick,
            onGenerateDLO,
            onGenerateDMO,
        },
        // 'nodrag' ensures clicking on the node itself doesn't pan the canvas
        // className: 'nodrag',
    }));
};

/**
 * @function mapRelationshipsToEdges
 * @description Converts the domain-specific Relationship array into the structure required by React Flow Edges.
 * @param {Relationship[]} relationships - The core domain relationship objects.
 * @returns {Edge[]} The array of React Flow Edges.
 */
export const mapRelationshipsToEdges = (relationships: Relationship[]): Edge[] => {
    return relationships.map((rel) => ({
        id: `e-${rel.sourceEntityId}-${rel.targetEntityId}`,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        type: 'smoothstep', // Default to smoothstep for clean appearance
        markerEnd: {
            type: MarkerType.ArrowClosed,
        },
    }));
};
