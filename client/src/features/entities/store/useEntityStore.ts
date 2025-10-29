// src/features/entities/store/useEntityStore.ts

import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection, // Type for the connection object
} from 'reactflow';
// NOTE: devtools middleware should be added in a production scenario for debugging.

/**
 * @interface EntityState
 * @description Defines the canonical state structure for the canvas visualization.
 * This modular store keeps all React Flow-related state separated.
 * @property {Node[]} nodes - The array of visualizer nodes (Entities).
 * @property {Edge[]} edges - The array of visualizer edges (Relationships).
 * @property {string[]} selectedNodeIds - Array of currently selected node IDs.
 */
interface EntityState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeIds: string[];

  // Actions are defined here to centralize state modification logic.
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeIds: (ids: string[]) => void;
}

export const useEntityStore = create<EntityState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeIds: [],

  /**
   * Updates the node state in response to React Flow events (e.g., drag, select).
   * This encapsulation maintains the controlled component pattern.
   * @param {NodeChange[]} changes - The array of node changes provided by React Flow.
   */
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  /**
   * Updates the edge state in response to React Flow events (e.g., delete).
   * @param {EdgeChange[]} changes - The array of edge changes provided by React Flow.
   */
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  /**
   * Adds a new edge after a successful connection between two nodes.
   * @param {Connection} connection - The new connection object.
   */
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep', // Using 'smoothstep' for cleaner default routing
        },
        get().edges
      ),
    });
  },

  /**
   * Overwrites the current node array entirely.
   * @param {Node[]} nodes - The new array of nodes.
   */
  setNodes: (nodes) => set({ nodes }),

  /**
   * Overwrites the current edge array entirely.
   * @param {Edge[]} edges - The new array of edges.
   */
  setEdges: (edges) => set({ edges }),

  /**
   * Updates the list of currently selected node IDs.
   * @param {string[]} ids - The array of selected node IDs.
   */
  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
}));
