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
  dragState: DragState | null;
  handleEntityDragStart: (entityId: string, e: React.DragEvent) => void;
  handleEntityDrag: (e: React.DragEvent) => void;
  handleEntityDragEnd: () => void;
}

/**
 * Hook for managing entity drag-and-drop operations on the canvas.
 * Tracks drag state and calculates entity positions during drag operations,
 * with final snap-to-grid on drop.
 *
 * @param {RefObject<HTMLDivElement>} canvasRef - Ref to the canvas container element
 * @param {Entity[]} entities - Array of entities for position lookups
 * @param {function} onUpdateEntityPosition - Callback to persist position updates
 * @returns {UseEntityDragReturn}
 */
export function useEntityDrag(
  canvasRef: RefObject<HTMLDivElement>,
  entities: Entity[],
  onUpdateEntityPosition: (entityId: string, position: { x: number; y: number }) => void
): UseEntityDragReturn {
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handleEntityDragStart = useCallback(
    (entityId: string, e: React.DragEvent) => {
      e.stopPropagation();
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
      const newX = e.clientX - rect.left - dragState.offsetX;
      const newY = e.clientY - rect.top - dragState.offsetY;

      onUpdateEntityPosition(dragState.entityId, { x: newX, y: newY });
    },
    [dragState, canvasRef, onUpdateEntityPosition]
  );

  const handleEntityDragEnd = useCallback(() => {
    if (!dragState) {
      return;
    }

    const entity = entities.find((e) => e.id === dragState.entityId);
    if (entity?.position) {
      const GRID_SIZE = 20;
      const snappedPosition = {
        x: Math.round(entity.position.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(entity.position.y / GRID_SIZE) * GRID_SIZE,
      };
      onUpdateEntityPosition(dragState.entityId, snappedPosition);
    }

    setDragState(null);
  }, [dragState, entities, onUpdateEntityPosition]);

  return {
    dragState,
    handleEntityDragStart,
    handleEntityDrag,
    handleEntityDragEnd,
  };
}
