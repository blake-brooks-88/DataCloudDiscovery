import { useState, useCallback, RefObject } from 'react';
import type { Entity } from '@shared/schema';

/**
 * Internal state tracking active drag operation.
 */
interface DragState {
  entityId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Return type for the useEntityDrag hook.
 */
export interface UseEntityDragReturn {
  /** The ID of the entity currently being dragged, or null. */
  draggedEntityId: string | null;
  /** Local position overrides during drag for optimistic updates */
  draggedEntityPosition: { entityId: string; x: number; y: number } | null;
  handleEntityDragStart: (entityId: string, e: React.DragEvent) => void;
  handleEntityDrag: (e: React.DragEvent) => void;
  handleEntityDragEnd: () => void;
}

/**
 * Optimized hook for entity drag-and-drop with local state management.
 * Uses local state during drag for 60fps performance, only persisting on drop.
 * This prevents laggy updates caused by frequent storage writes during drag.
 *
 * @param {RefObject<HTMLDivElement>} canvasRef - Ref to the canvas container element
 * @param {Entity[]} entities - Array of entities for position lookups
 * @param {function} onUpdateEntityPosition - Callback to persist position on drop only
 * @returns {UseEntityDragReturn}
 */
export function useEntityDrag(
  canvasRef: RefObject<HTMLDivElement>,
  entities: Entity[],
  onUpdateEntityPosition: (entityId: string, position: { x: number; y: number }) => void
): UseEntityDragReturn {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [draggedEntityPosition, setDraggedEntityPosition] = useState<{
    entityId: string;
    x: number;
    y: number;
  } | null>(null);

  // This property is used in GraphView to conditionally hide the source entity
  const draggedEntityId = dragState?.entityId ?? null;

  const handleEntityDragStart = useCallback(
    (entityId: string, e: React.DragEvent) => {
      e.stopPropagation();

      // To prevent the double-node issue, we explicitly hide the native drag image.
      e.dataTransfer.setDragImage(new Image(), 0, 0);

      const entity = entities.find((ent) => ent.id === entityId);
      if (!entity) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      // Record mouse offset relative to entity's top-left to prevent jump
      setDragState({
        entityId,
        startX: entity.position?.x || 100,
        startY: entity.position?.y || 100,
        offsetX: e.clientX - rect.left - (entity.position?.x || 100),
        offsetY: e.clientY - rect.top - (entity.position?.y || 100),
      });
    },
    [entities, canvasRef]
  );

  const handleEntityDrag = useCallback(
    (e: React.DragEvent) => {
      if (!dragState || !canvasRef.current) {
        return;
      }

      // Ignore spurious (0,0) coordinates that fire on drop
      if (e.clientX === 0 && e.clientY === 0) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      // Calculate new position based on current mouse position and stored offset
      const newX = e.clientX - rect.left - dragState.offsetX;
      const newY = e.clientY - rect.top - dragState.offsetY;

      // Update local state only - no storage writes during drag
      setDraggedEntityPosition({
        entityId: dragState.entityId,
        x: newX,
        y: newY,
      });
    },
    [dragState, canvasRef]
  );

  const handleEntityDragEnd = useCallback(() => {
    if (!dragState || !draggedEntityPosition) {
      setDragState(null);
      setDraggedEntityPosition(null);
      return;
    }

    const GRID_SIZE = 20;
    // Snap the final position to the 4-point grid (20px snap interval)
    const snappedPosition = {
      x: Math.round(draggedEntityPosition.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(draggedEntityPosition.y / GRID_SIZE) * GRID_SIZE,
    };

    // Only persist to storage once, on drop
    onUpdateEntityPosition(dragState.entityId, snappedPosition);

    setDragState(null);
    setDraggedEntityPosition(null);
  }, [dragState, draggedEntityPosition, onUpdateEntityPosition]);

  return {
    draggedEntityId,
    draggedEntityPosition,
    handleEntityDragStart,
    handleEntityDrag,
    handleEntityDragEnd,
  };
}
