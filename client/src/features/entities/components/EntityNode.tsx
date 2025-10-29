import React, { useCallback } from 'react';
import { NodeProps, Handle, Position, NodeToolbar } from 'reactflow';
// FIX: Changed EntityField to the correctly exported name, Field.
import { Table, Trash2, Code, Download, ChevronDown } from 'lucide-react';
import { Field } from '@shared/schema';

// We import component types from the utility file
import { EntityNodeData } from '../utils/nodeMapper';

// We import shared UI components
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * @component EntityNode
 * @description The custom component for rendering an Entity within the React Flow canvas.
 * It uses React.memo for mandatory performance optimization (Part V, 5.2).
 * @param {NodeProps<EntityNodeData>} props - The required React Flow props, with custom data under the 'data' field.
 * @returns {JSX.Element} The visual entity node card.
 */
const EntityNode: React.FC<NodeProps<EntityNodeData>> = (props) => {
  // Destructure custom data and required RF props
  const { entity, onDoubleClick, onGenerateDLO, onGenerateDMO } = props.data;
  const isSelected = props.selected;

  // --- Handlers for Domain Actions ---
  const handleGenerateDLO = useCallback(() => {
    if (onGenerateDLO) {
      onGenerateDLO(entity);
    }
  }, [entity, onGenerateDLO]);

  const handleGenerateDMO = useCallback(() => {
    if (onGenerateDMO) {
      onGenerateDMO(entity);
    }
  }, [entity, onGenerateDMO]);

  const handleDoubleClick = useCallback(() => {
    if (onDoubleClick) {
      onDoubleClick(entity);
    }
  }, [entity, onDoubleClick]);

  // --- Dynamic Styling based on Design Tokens (Style Guide) ---

  // Applies Shadow-MD, Radius-LG, and CoolGray-based borders.
  const cardClasses = `
    w-64 max-w-sm border-2 transition-all duration-150 ease-in-out
    shadow-md rounded-lg bg-white text-coolgray-600 
    ${
      isSelected
        ? 'border-secondary-500 ring-4 ring-secondary-200'
        : 'border-coolgray-200 hover:shadow-lg'
    }
    nopan
  `;

  return (
    <Card
      className={cardClasses}
      onDoubleClick={handleDoubleClick}
      data-testid={`entity-node-${entity.id}`}
      data-handle-id={entity.id}
    >
      {/* NodeToolbar uses Shadow-LG for high visual elevation (Overlay standard) */}
      <NodeToolbar
        position={Position.Top}
        className="flex space-x-2 bg-white p-2 rounded-md shadow-lg border border-coolgray-200"
      >
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-coolgray-500 hover:text-danger-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-coolgray-500">
              <Code className="h-4 w-4 mr-1" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-1">
            <DropdownMenuItem onClick={handleGenerateDLO} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              <span>Generate DLO</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGenerateDMO} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              <span>Generate DMO</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </NodeToolbar>

      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
        <h3 className="font-bold text-sm text-coolgray-700 truncate max-w-[80%]">{entity.name}</h3>
        <div className="flex items-center space-x-1 text-coolgray-400">
          <Table className="h-4 w-4" />
        </div>
      </CardHeader>

      <Separator className="bg-coolgray-200" />

      <CardContent className="p-0 text-xs">
        {/* Uses font-mono (JetBrains Mono) for code fidelity [cite: style guide] */}
        {/* FIX: Changed EntityField to Field in the map argument */}
        {entity.fields &&
          entity.fields.slice(0, 4).map((field: Field) => (
            <div
              key={field.id}
              className="flex items-center justify-between px-3 py-1.5 border-b border-coolgray-100 hover:bg-coolgray-50 transition-colors"
            >
              <span className="truncate">{field.name}</span>
              <span className="text-coolgray-400 font-mono text-[10px] uppercase ml-2">
                {field.type.slice(0, 5)}
              </span>
            </div>
          ))}

        {entity.fields && entity.fields.length > 4 && (
          <div className="text-center py-1 text-coolgray-400 italic text-[10px]">
            ... {entity.fields.length - 4} more fields
          </div>
        )}
      </CardContent>

      {/* Handles for Connections: Uses Primary and Secondary brand colors */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary-500 border-2 border-primary-100"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-secondary-500 border-2 border-secondary-100"
      />
    </Card>
  );
};

export default React.memo(EntityNode);
