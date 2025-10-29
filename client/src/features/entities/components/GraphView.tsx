import { useCallback, useMemo, useEffect } from 'react'; // Import useState
import type { Entity, Relationship } from '@shared/schema';
import ReactFlow, {
  Background,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useEntityStore } from '../store/useEntityStore';
import { useEntitySearch } from '../hooks/useEntitySearch';
import { mapEntitiesToNodes, mapRelationshipsToEdges } from '../utils/nodeMapper';

import ViewportControls from './ViewportControls';
import { SearchResultsPanel } from './SearchResultsPanel';
import { CanvasLegend } from './CanvasLegend';

import EntityNode from './EntityNode';
import {
  FieldLineageEdge,
  FKReferenceEdge,
  FeedsIntoEdge,
  TransformsToEdge,
} from '../../relationships';

const nodeTypes = {
  entity: EntityNode,
};

const edgeTypes = {
  'field-lineage': FieldLineageEdge,
  'fk-reference': FKReferenceEdge,
  'feeds-into': FeedsIntoEdge,
  'transforms-to': TransformsToEdge,
};

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

  // --- FIX: Data Synchronization Refactored ---

  // Effect 1: Synchronize nodes when entities or their callbacks change
  useEffect(() => {
    setNodes(mapEntitiesToNodes(entities, onEntityDoubleClick, onGenerateDLO, onGenerateDMO));
  }, [entities, onEntityDoubleClick, onGenerateDLO, onGenerateDMO, setNodes]);

  // Effect 2: Synchronize edges when entities OR relationships change
  // This is the core fix. It listens for changes to 'relationships'
  // and re-maps the edges, which was not happening before.
  useEffect(() => {
    setEdges(mapRelationshipsToEdges(relationships, entities));
  }, [relationships, entities, setEdges]);

  // Effect 3: Fit view only once on initial mount
  useEffect(() => {
    // We run this with a small delay to allow the layout to settle
    const timer = setTimeout(() => fitView({ padding: 0.1 }), 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitView]); // 'fitView' is stable and this will run only once

  // --- End of Fix ---

  const handlePaneClick = useCallback(() => {
    onSelectEntity(null);
  }, [onSelectEntity]);

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node, allNodes: Node[]) => {
      const updatedNode = allNodes.find((n) => n.id === node.id);

      if (updatedNode?.position) {
        const GRID_SIZE = 20;
        const snappedPosition = {
          x: Math.round(updatedNode.position.x / GRID_SIZE) * GRID_SIZE,
          y: Math.round(updatedNode.position.y / GRID_SIZE) * GRID_SIZE,
        };

        setNodes(
          nodes.map((n) => (n.id === updatedNode.id ? { ...n, position: snappedPosition } : n))
        );

        onUpdateEntityPosition(node.id, snappedPosition).catch((error) => {
          console.error('Failed to persist entity position. Rolling back/handling error.', error);
        });
      }
    },
    [onUpdateEntityPosition, setNodes, nodes]
  );

  // ... (filteredNodes and handleCenterOnEntity remain the same) ...
  const filteredNodes = useMemo(() => {
    if (!search.hasSearchQuery) {
      return nodes.map((node) => ({
        ...node,
        hidden: false,
        data: {
          ...node.data,
          isSearchMatch: false,
          dimmed: false,
        },
      }));
    }

    const matchingIds = search.matchingEntities.map((e) => e.id);

    return nodes.map((node) => {
      const isMatch = matchingIds.includes(node.id);
      const shouldDim = !isMatch;

      const updatedData = {
        ...node.data,
        isSearchMatch: isMatch,
        dimmed: shouldDim,
      };

      return {
        ...node,
        data: updatedData,
        hidden: false,
      };
    });
  }, [nodes, search.hasSearchQuery, search.matchingEntities]);

  const handleCenterOnEntity = useCallback(
    (entityId: string) => {
      onSelectEntity(entityId);

      fitView({
        nodes: [{ id: entityId, width: 320, height: 100, position: { x: 0, y: 0 } }],
        duration: 300,
        maxZoom: 2,
        padding: 0.5,
      });
    },
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
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={4}
        onNodeClick={(_event, node) => onSelectEntity(node.id)}
        onPaneClick={handlePaneClick}
        onNodeDragStop={handleNodeDragStop}
        proOptions={{ hideAttribution: true }}
        className="w-full h-full"
        panOnDrag={false}
        panOnScroll={true}
        zoomOnScroll={true}
        selectionOnDrag={true}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={2}
          color={'#E2E8F0'} //CoolGray-50
        />

        <svg style={{ position: 'absolute', opacity: 0 }}>
          <defs>
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
            {/* You will need markers for the 'feeds-into' (blue) edge here too */}
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
