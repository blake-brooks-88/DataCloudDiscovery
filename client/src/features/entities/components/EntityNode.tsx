import React, { useCallback, useMemo } from 'react';
import { NodeProps, Handle, Position, NodeToolbar } from 'reactflow';
import { Table, Trash2, Code, Download, ChevronDown } from 'lucide-react';
import { Field } from '@shared/schema';

import { EntityNodeData } from '../utils/nodeMapper';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// --- Layout Constants (Derived from 4-Point Grid tailwind.config ---
// These are necessary for calculating the precise Y-position of the Handles.
const NODE_HEADER_HEIGHT = 48; // p-3 + pb-2 + content height (approx 48px to the separator)
const SEPARATOR_HEIGHT = 1; // border-coolgray-200
const FIELD_ROW_HEIGHT = 32; // py-1.5 (6px) + content height (16px) + py-1.5 (6px) = 28px. Using 32px for safe alignment on 4-point grid.

/**
 * Calculates the Y-position for a React Flow Handle for a specific field index.
 * The Y position is relative to the top of the node card.
 *
 * @param {number} index - The index of the field in the entity's fields array (starting at 0).
 * @returns {number} The absolute Y coordinate for the Handle's center.
 */
const getFieldHandleYPosition = (index: number): number => {
  // Start at the bottom of the header/separator, then add the accumulated height of rows,
  // plus half the height of the current row to center the Handle.
  return (
    NODE_HEADER_HEIGHT +
    SEPARATOR_HEIGHT +
    (index * FIELD_ROW_HEIGHT) +
    (FIELD_ROW_HEIGHT / 2)
  );
};

/**
 * @component EntityNode
 * @description The custom component for rendering an Entity within the React Flow canvas.
 * It dynamically renders Handles for each field to support field-level lineage.
 * @param {NodeProps<EntityNodeData>} props - The required React Flow props, with custom data under the 'data' field.
 * @returns {JSX.Element} The visual entity node card.
 */
const EntityNode: React.FC<NodeProps<EntityNodeData>> = (props) => {
  const { entity, onDoubleClick, onGenerateDLO, onGenerateDMO } = props.data;
  const isSelected = props.selected;

  // --- Handlers for Domain Actions (Memoized for performance) ---
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

  // --- Dynamic Styling based on Design Tokens in tailwind.config ---
  const cardClasses = `
    w-64 max-w-sm border-2 transition-all duration-150 ease-in-out
    shadow-md rounded-lg bg-white text-coolgray-600 
    ${isSelected
      ? 'border-secondary-500 ring-4 ring-secondary-200'
      : 'border-coolgray-200 hover:shadow-lg'
    }
    nopan
  `;

  // Get the first 4 fields to display
  const visibleFields = useMemo(() => entity.fields.slice(0, 4), [entity.fields]);
  const hiddenFieldCount = entity.fields.length > 4 ? entity.fields.length - 4 : 0;

  // Determines the primary type icon based on EntityType (for Phase 2: DMO, DLO, etc.)
  const TypeIcon = useMemo(() => {
    // For now, only using Table, but this will be expanded for DLO/DMO/DataStream icons
    return <Table className="h-4 w-4" />;
  }, [entity.type]);


  return (
    <Card
      className={cardClasses}
      onDoubleClick={handleDoubleClick}
      data-testid={`entity-node-${entity.id}`}
      data-handle-id={entity.id}
      style={{
        minHeight: NODE_HEADER_HEIGHT + SEPARATOR_HEIGHT + (visibleFields.length * FIELD_ROW_HEIGHT) + (hiddenFieldCount > 0 ? FIELD_ROW_HEIGHT : 0),
      }}
    >
      <NodeToolbar
        position={Position.Top}
        className="flex space-x-2 bg-white p-2 rounded-md shadow-lg border border-coolgray-200"
      >
        {/* Toolbar actions omitted for brevity, but exist as in original */}
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

      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between h-[48px]">
        <h3 className="font-bold text-sm text-coolgray-700 truncate max-w-[80%]">{entity.name}</h3>
        <div className="flex items-center space-x-1 text-coolgray-400">
          {TypeIcon}
        </div>
      </CardHeader>

      <Separator className="bg-coolgray-200" />

      <CardContent className="p-0 text-xs">
        {entity.fields.map((field: Field, index: number) => {
          // Only render the first 4 field rows to keep the node compact on the graph
          if (index >= 4) return null;
          const yPos = getFieldHandleYPosition(index);
          const isTarget = true;
          // CRITICAL FIX: isSource must be TRUE if the entity is not a DMO, or if the field is an FK.
          // For simplicity and future-proofing, we make all *visible* fields sources.
          // This allows DLO/DataStream fields to be output sources for maps-to.
          const isSource = true;

          // NOTE: We rely on the mapper/data to filter which fields are actually connected.

          return (
            <div
              key={field.id}
              className="flex items-center justify-between px-3 py-1.5 border-b border-coolgray-100 hover:bg-coolgray-50 transition-colors h-8"
              data-field-id={field.id} // Custom attribute for easy lookup
            >
              <span className="truncate">{field.name}</span>
              <span className="text-coolgray-400 font-mono text-[10px] uppercase ml-2">
                {field.type.slice(0, 5)}
              </span>

              {/* Target Handle: Always on the left for receiving input/lineage (DMO inputs) */}
              {isTarget && (
                <Handle
                  id={`field-target-${field.id}`}
                  type="target"
                  position={Position.Left}
                  style={{ top: yPos, opacity: 0 }}
                  className="w-3 h-3 bg-secondary-500 border-2 border-secondary-100 absolute"
                />
              )}

              {/* Source Handle: On the right for ALL fields to enable DLO->DMO output and FK references */}
              {isSource && (
                <Handle
                  id={`field-source-${field.id}`}
                  type="source"
                  position={Position.Right}
                  style={{ top: yPos, opacity: 0 }}
                  // FKs are a subset of source, so we use the Primary-500 color for all outputs
                  className="w-3 h-3 bg-primary-500 border-2 border-primary-100 absolute"
                />
              )}
            </div>
          );
        })}
        {hiddenFieldCount > 0 && (
          <div className="text-center py-1 text-coolgray-400 italic text-[10px]">
            ... {hiddenFieldCount} more fields
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(EntityNode);