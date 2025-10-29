import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Panel } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ViewportControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

const ViewportControlsComponent: React.FC<ViewportControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
}) => {
  const panelClasses =
    'flex flex-col bg-white shadow-md rounded-md border border-coolgray-200 p-1 space-y-1';
  const buttonClasses = 'w-8 h-8 p-1 text-coolgray-500 hover:bg-coolgray-100 rounded-sm';

  return (
    <Panel position="top-right" className={panelClasses}>
      <Button onClick={onZoomIn} variant="ghost" className={buttonClasses} aria-label="Zoom In">
        <ZoomIn className="w-5 h-5" />
      </Button>

      <Button onClick={onZoomOut} variant="ghost" className={buttonClasses} aria-label="Zoom Out">
        <ZoomOut className="w-5 h-5" />
      </Button>

      <Separator className="bg-coolgray-200" />

      <Button
        onClick={onFitToScreen}
        variant="ghost"
        className={buttonClasses}
        aria-label="Fit View"
      >
        <Maximize2 className="w-5 h-5" />
      </Button>
    </Panel>
  );
};

const ViewportControls = React.memo(ViewportControlsComponent);
ViewportControls.displayName = 'ViewportControls';

export default ViewportControls;
