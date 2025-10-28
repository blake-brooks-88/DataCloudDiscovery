import { useState, useEffect, useCallback, RefObject } from 'react';
import type { Entity } from '@shared/schema';

/**
 * Viewport state for canvas pan and zoom.
 */
export interface ViewportState {
  panOffset: { x: number; y: number };
  zoom: number;
}

/**
 * Return type for the useCanvasViewport hook.
 */
export interface UseCanvasViewportReturn {
  panOffset: { x: number; y: number };
  zoom: number;
  handleWheel: (e: React.WheelEvent) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetView: () => void;
  handleFitToScreen: () => void;
  centerOnEntity: (entityId: string) => void;
}

/**
 * Hook for managing canvas viewport state including pan, zoom, and view controls.
 * Handles mouse wheel events for zooming and panning, keyboard shortcuts,
 * and programmatic viewport manipulation (fit-to-screen, center on entity).
 *
 * @param {RefObject<HTMLDivElement>} canvasRef - Ref to the canvas container element
 * @param {Entity[]} entities - Array of entities to calculate bounds for fit-to-screen
 * @returns {UseCanvasViewportReturn}
 */
export function useCanvasViewport(
  canvasRef: RefObject<HTMLDivElement>,
  entities: Entity[]
): UseCanvasViewportReturn {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);

  const handleZoomIn = useCallback(() => {
    setZoom((prevZoom) => Math.min(5.0, prevZoom + 0.1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prevZoom) => Math.max(0.1, prevZoom - 0.1));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  /**
   * Calculates bounding box of all entities and adjusts viewport to fit them
   * with padding. Limits maximum zoom to 100% to avoid excessive magnification.
   */
  const handleFitToScreen = useCallback(() => {
    if (entities.length === 0 || !canvasRef.current) {
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    const ENTITY_WIDTH = 320;
    const ENTITY_HEIGHT = 200;

    entities.forEach((entity) => {
      const x = entity.position?.x || 100;
      const y = entity.position?.y || 100;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + ENTITY_WIDTH);
      maxY = Math.max(maxY, y + ENTITY_HEIGHT);
    });

    const bounds = {
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };

    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 100;

    const scaleX = (rect.width - padding * 2) / bounds.width;
    const scaleY = (rect.height - padding * 2) / bounds.height;

    const newZoom = Math.min(Math.max(scaleX, scaleY), 1.0);

    setZoom(newZoom);
    setPanOffset({
      x: rect.width / 2 - bounds.centerX * newZoom,
      y: rect.height / 2 - bounds.centerY * newZoom,
    });
  }, [entities, canvasRef]);

  /**
   * Centers the viewport on a specific entity. If zoomed out below 80%,
   * resets zoom to 100% for better visibility.
   */
  const centerOnEntity = useCallback(
    (entityId: string) => {
      const entity = entities.find((e) => e.id === entityId);
      if (!entity || !canvasRef.current) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const entityX = entity.position?.x || 100;
      const entityY = entity.position?.y || 100;

      const newZoom = zoom < 0.8 ? 1.0 : zoom;
      if (zoom < 0.8) {
        setZoom(newZoom);
      }

      setPanOffset({
        x: rect.width / 2 - (entityX + 160) * newZoom,
        y: rect.height / 2 - (entityY + 100) * newZoom,
      });
    },
    [entities, canvasRef, zoom]
  );

  /**
   * Handles mouse wheel events for zooming (with Ctrl/Cmd) and panning.
   * - Ctrl/Cmd + Scroll: Zoom in/out relative to cursor position
   * - Shift + Scroll: Horizontal pan
   * - Regular Scroll: Vertical pan (or both axes for trackpad)
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(5.0, Math.max(0.1, zoom + delta));
        const scale = newZoom / zoom;

        setPanOffset({
          x: mouseX - (mouseX - panOffset.x) * scale,
          y: mouseY - (mouseY - panOffset.y) * scale,
        });

        setZoom(newZoom);
      } else if (e.shiftKey) {
        setPanOffset({
          x: panOffset.x - e.deltaY,
          y: panOffset.y,
        });
      } else {
        setPanOffset({
          x: panOffset.x - e.deltaX,
          y: panOffset.y - e.deltaY,
        });
      }
    },
    [canvasRef, zoom, panOffset]
  );

  // Keyboard shortcuts for zoom controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetView();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetView, handleZoomIn, handleZoomOut]);

  return {
    panOffset,
    zoom,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleFitToScreen,
    centerOnEntity,
  };
}
