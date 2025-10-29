import { useCallback, useMemo, useEffect } from 'react';
import type { Entity, Relationship } from '@shared/schema';
import ReactFlow, {
  Background,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import the required components and mappers
import { useEntityStore } from '../store/useEntityStore';
import { useEntitySearch } from '../hooks/useEntitySearch';
import { mapEntitiesToNodes, mapRelationshipsToEdges } from '../utils/nodeMapper';

import ViewportControls from './ViewportControls';
import { SearchResultsPanel } from './SearchResultsPanel';
import { CanvasLegend } from './CanvasLegend';

import EntityNode from './EntityNode';
// Import the new custom edges
import FieldLineageEdge from '../../relationships/components/FieldLineageEdge';
import FKReferenceEdge from '../../relationships/components/FKReferenceEdge';

// --- CRITICAL IMPLEMENTATION DETAIL: Custom Node Map ---
const nodeTypes = {
  entity: EntityNode,
};
// --- END CRITICAL IMPLEMENTATION DETAIL ---

// --- CRITICAL IMPLEMENTATION DETAIL: Custom Edge Map ---
const edgeTypes = {
  'field-lineage': FieldLineageEdge,
  'fk-reference': FKReferenceEdge,
  // 'feeds-into': TBD, a custom animated edge will go here. For now, it uses default.
};
// --- END CRITICAL IMPLEMENTATION DETAIL ---

// The simplified component signature
export interface GraphViewProps {
  entities: Entity[];
  relationships?: Relationship[];
  selectedEntityId: string | null;
  searchQuery?: string;
  onSelectEntity: (entityId: string | null) => void;
  onUpdateEntityPosition: (entityId: string, position: { x: number; y: number }) => Promise<void>;
  onEntityDoubleClick: (entity: Entity) => void;
  onGenerateDLO?: (entity: Entity) => void;
  onGenerateDMO?: (entity: Entity) => void;
}

function GraphViewContent({
  entities,
  relationships = [],
  searchQuery = '',
  onSelectEntity,
  onUpdateEntityPosition,
  onEntityDoubleClick,
  onGenerateDLO,
  onGenerateDMO,
}: GraphViewProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } = useEntityStore();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const search = useEntitySearch(entities, searchQuery);

  // --- Data Initialization/Synchronization ---
  useEffect(() => {
    // Only re-map and set state if the core domain data structure has changed
    if (nodes.length !== entities.length) {
      setNodes(mapEntitiesToNodes(entities, onEntityDoubleClick, onGenerateDLO, onGenerateDMO));

      // CRITICAL UPDATE: Pass entities to mapRelationshipsToEdges to resolve field positions
      setEdges(mapRelationshipsToEdges(relationships, entities));

      // Fit the view on initial load
      setTimeout(() => fitView({ padding: 0.1 }), 50);
    }
  }, [entities, relationships, onEntityDoubleClick, onGenerateDLO, onGenerateDMO, setNodes, setEdges, nodes.length, fitView]);

  // --- Event Handlers (omitted for brevity) ---
  const handlePaneClick = useCallback(() => {
    onSelectEntity(null);
  }, [onSelectEntity]);

  // ... handleNodeDragStop remains the same ...
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent) => {
      // ... (logic from original GraphView.tsx) ...
    },
    [onUpdateEntityPosition, setNodes, nodes]
  );

  // ... filteredNodes and handleCenterOnEntity remain the same ...
  const filteredNodes = useMemo(() => {
    // ... (logic from original GraphView.tsx) ...
    return nodes; // Simplified return
  }, [nodes, search.hasSearchQuery, search.matchingEntities]);

  const handleCenterOnEntity = useCallback(
    // ... (logic from original GraphView.tsx) ...
    () => { },
    [fitView, onSelectEntity]
  );

  return (
    <div className="relative w-full h-full bg-coolgray-50" data-testid="graph-canvas">
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        // CRITICAL UPDATE: Pass edgeTypes to enable custom edges
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={4}
        onNodeClick={(_event, node) => onSelectEntity(node.id)}
        onPaneClick={handlePaneClick}
        onNodeDragStop={handleNodeDragStop}
        proOptions={{ hideAttribution: true }}
        className="w-full h-full"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={2}
          color={'#E2E8F0'} //CoolGray-50
        />

        {/* This is where the Crow's Foot SVG Markers should be defined */}
        <svg style={{ position: 'absolute', opacity: 0 }}>
          <defs>
            {/* Minimal example of a 'one' marker for the end of the line */}
            <marker
              id="cf-one"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <path d="M 0 5 L 10 5" stroke="#64748B" strokeWidth="2" fill="none" />
            </marker>
            {/* Minimal example of a 'many' marker for the start of the line */}
            <marker
              id="cf-many"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <path d="M 10 0 L 0 5 L 10 10" stroke="#64748B" strokeWidth="2" fill="none" />
            </marker>
            {/* Define the green arrow for lineage */}
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#BED163" />
            </marker>
          </defs>
        </svg>

        <ViewportControls
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          onFitToScreen={() => fitView()}
        />

      </ReactFlow>

      <SearchResultsPanel
        matchingEntities={search.matchingEntities}
        searchQuery={searchQuery}
        onCenterOnEntity={handleCenterOnEntity}
      />
      <CanvasLegend />

      {entities.length === 0 && (
        // ... (No entities message) ...
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <p className="text-xl font-semibold text-coolgray-400">No entities yet</p>
            <p className="text-sm text-coolgray-500 mt-2">
              Click the + button to add your first entity
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @component GraphView
 * @description Wraps the core logic in a ReactFlowProvider to enable useReactFlow hooks in children.
 * @param {GraphViewProps} props - The properties for the graph view.
 * @returns {JSX.Element} The visual canvas component.
 */
export default function GraphView(props: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewContent {...props} />
    </ReactFlowProvider>
  );
}
