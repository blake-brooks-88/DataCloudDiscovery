import { useCallback, useMemo, useEffect } from 'react';
import type { Entity, Relationship } from '@shared/schema';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  Node,
  BackgroundVariant,
  useReactFlow, // Allows access to internal controls like fitView, zoomIn/Out
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import the required state store and mappers
import { useEntityStore } from '../store/useEntityStore';
import { useEntitySearch } from '../hooks/useEntitySearch';
import { mapEntitiesToNodes, mapRelationshipsToEdges } from '../utils/nodeMapper';

// Corrected imports to direct paths
import ViewportControls from './ViewportControls';
import { SearchResultsPanel } from './SearchResultsPanel';
import { CanvasLegend } from './CanvasLegend';

import EntityNode from './EntityNode';

// --- CRITICAL IMPLEMENTATION DETAIL: Custom Node Map ---
const nodeTypes = {
  entity: EntityNode,
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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } =
    useEntityStore();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const search = useEntitySearch(entities, searchQuery);

  // --- Data Initialization/Synchronization ---
  useEffect(() => {
    // Only re-map and set state if the core domain data structure has changed
    // This prevents unnecessary remaps when only position changes.
    if (nodes.length !== entities.length) {
      setNodes(mapEntitiesToNodes(entities, onEntityDoubleClick, onGenerateDLO, onGenerateDMO));
      setEdges(mapRelationshipsToEdges(relationships));
      // Fit the view on initial load
      setTimeout(() => fitView({ padding: 0.1 }), 50);
    }
  }, [
    entities,
    relationships,
    onEntityDoubleClick,
    onGenerateDLO,
    onGenerateDMO,
    setNodes,
    setEdges,
    nodes.length,
    fitView,
  ]);

  // --- Event Handlers ---

  const handlePaneClick = useCallback(() => {
    onSelectEntity(null);
  }, [onSelectEntity]);

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node, allNodes: Node[]) => {
      const updatedNode = allNodes.find((n) => n.id === node.id);

      if (updatedNode?.position) {
        // Implementing Grid Snapping Logic
        const GRID_SIZE = 20;
        const snappedPosition = {
          x: Math.round(updatedNode.position.x / GRID_SIZE) * GRID_SIZE,
          y: Math.round(updatedNode.position.y / GRID_SIZE) * GRID_SIZE,
        };

        // 1. Update the Zustand store immediately with the snapped position (Optimistic update)
        setNodes(
          nodes.map((n) => (n.id === updatedNode.id ? { ...n, position: snappedPosition } : n))
        );

        // 2. Persist the snapped position to storage (side effect)
        onUpdateEntityPosition(node.id, snappedPosition).catch((error) => {
          // External Context: CRITICAL ROLLBACK/ERROR
          console.error(
            'Failed to persist entity position. Please check network connection.',
            error
          );
        });
      }
    },
    [onUpdateEntityPosition, setNodes, nodes]
  );

  const filteredNodes = useMemo(() => {
    if (!search.hasSearchQuery) {
      return nodes;
    }

    const matchingIds = search.matchingEntities.map((e) => e.id);

    return nodes.map((node) => ({
      ...node,
      // React Flow respects the 'hidden' property for display culling
      hidden: !matchingIds.includes(node.id),
    }));
  }, [nodes, search.hasSearchQuery, search.matchingEntities]);

  const handleCenterOnEntity = useCallback(
    (entityId: string) => {
      onSelectEntity(entityId);
      // Center the view on the selected node
      fitView({
        nodes: [{ id: entityId, width: 200, height: 100, position: { x: 0, y: 0 } }],
        duration: 300,
        maxZoom: 2,
        padding: 0.5,
      });
    },
    [fitView, onSelectEntity]
  );

  // CHANGE: Define the dot color using a subtle CoolGray shade for faint dots.
  const backgroundCoolGray100 = '#F1F5F9'; // CoolGray-100 for very subtle dots

  return (
    <div className="relative w-full h-full bg-coolgray-50" data-testid="graph-canvas">
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={4}
        onNodeClick={(_event, node) => onSelectEntity(node.id)}
        onPaneClick={handlePaneClick}
        onNodeDragStop={handleNodeDragStop}
        proOptions={{ hideAttribution: true }}
        className="w-full h-full"
      >
        {/* CHANGE: Update Background component to use a fainter color (CoolGray-100) 
        for the dots to ensure they are subtle and non-distracting. */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={backgroundCoolGray100} // Changed from CoolGray-200 to CoolGray-100
        />

        <Controls
          position="bottom-left"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          // FIX: Correcting the style object to use the CSS variable directly,
          // or a standard CSS property object structure.
          style={{
            filter:
              'invert(37%) sepia(10%) saturate(1132%) hue-rotate(190deg) brightness(95%) contrast(89%)',
          }}
        />

        {/* ViewportControls now calls the useReactFlow commands directly */}
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
