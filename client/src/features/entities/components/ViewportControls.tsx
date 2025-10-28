import { Plus, Minus, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * Props for the ViewportControls component.
 */
export interface ViewportControlsProps {
  /** Current zoom level (0.1 to 5.0) */
  zoom: number;
  /** Callback when zoom in is clicked */
  onZoomIn: () => void;
  /** Callback when zoom out is clicked */
  onZoomOut: () => void;
  /** Callback when fit to screen is clicked */
  onFitToScreen: () => void;
  /** Callback when reset view is clicked */
  onResetView: () => void;
}

/**
 * Floating viewport control panel for canvas zoom and positioning.
 * Displays current zoom level and provides buttons for zoom/fit/reset operations.
 *
 * @param {ViewportControlsProps} props - Component props
 * @returns {JSX.Element}
 */
export function ViewportControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
}: ViewportControlsProps) {
  return (
    <div
      className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-2 flex flex-col gap-1 z-10"
      data-testid="viewport-controls"
    >
      <Button onClick={onZoomIn} data-testid="button-zoom-in">
        <Plus className="h-4 w-4" />
      </Button>
      <div className="text-xs text-center font-mono" data-testid="text-zoom-level">
        {Math.round(zoom * 100)}%
      </div>
      <Button onClick={onZoomOut} data-testid="button-zoom-out">
        <Minus className="h-4 w-4" />
      </Button>
      <Separator />
      <Button onClick={onFitToScreen} title="Fit to Screen" data-testid="button-fit-screen">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button onClick={onResetView} title="Reset View" data-testid="button-reset-view">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
