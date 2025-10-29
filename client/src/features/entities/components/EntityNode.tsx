import React, { useCallback, useMemo } from 'react';
import { NodeProps, Handle, Position, NodeToolbar } from 'reactflow';
import {
  Table,
  Trash2,
  Code,
  Download,
  ChevronDown,
  Waves,
  Cylinder,
  Layers,
  Wand,
} from 'lucide-react';
import type { Field } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

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

// --- Layout Constants (Synchronized) ---
const NODE_HEADER_HEIGHT = 48;
const METADATA_ROW_HEIGHT = 32; // Enforce h-8 (32px)
const SEPARATOR_HEIGHT = 1;
const FIELD_ROW_HEIGHT = 32; // Enforce h-8 (32px)

// --- CONFIG 1: Node Base and Hover Styles ---
const TYPE_STYLE_MAP = {
  'data-stream': {
    base: 'border-secondary-500 bg-secondary-50 text-secondary-800',
    hover: 'hover:bg-secondary-100',
    selected: 'ring-secondary-200',
  },
  dlo: {
    base: 'border-tertiary-500 bg-tertiary-50 text-tertiary-800',
    hover: 'hover:bg-tertiary-100',
    selected: 'ring-tertiary-200',
  },
  dmo: {
    base: 'border-primary-500 bg-primary-50 text-primary-800',
    hover: 'hover:bg-primary-100',
    selected: 'ring-primary-200',
  },
  default: {
    base: 'border-coolgray-200 bg-white text-coolgray-600',
    hover: 'hover:bg-coolgray-100',
    selected: 'ring-primary-200',
  },
} as const;

// --- CONFIG 2: Icon and Badge Styles ---
const TYPE_CONFIG_MAP = {
  'data-stream': {
    Icon: Waves,
    BadgeText: 'Data Stream',
    IconColorClass: 'text-secondary-500',
    BadgeColorClass: 'bg-secondary-700 text-white',
  },
  dlo: {
    Icon: Cylinder,
    BadgeText: 'DLO',
    IconColorClass: 'text-tertiary-500',
    BadgeColorClass: 'bg-tertiary-700 text-white',
  },
  dmo: {
    Icon: Layers,
    BadgeText: 'DMO',
    IconColorClass: 'text-primary-500',
    BadgeColorClass: 'bg-primary-700 text-white',
  },
  default: {
    Icon: Table,
    BadgeText: 'Entity',
    IconColorClass: 'text-coolgray-500',
    BadgeColorClass: 'bg-coolgray-700 text-white',
  },
} as const;

/**
 * Calculates the Y-position for a React Flow Handle for a specific field index.
 */
const getFieldHandleYPosition = (index: number): number => {
  // FIX: Must account for all elements above the fields list
  const PADDING_TOP = NODE_HEADER_HEIGHT + METADATA_ROW_HEIGHT + SEPARATOR_HEIGHT;
  return PADDING_TOP + index * FIELD_ROW_HEIGHT + FIELD_ROW_HEIGHT / 2;
};

/**
 * @component EntityNode
 * @description The custom component for rendering an Entity within the React Flow canvas.
 */
const EntityNode: React.FC<NodeProps<EntityNodeData>> = (props) => {
  const { entity, onDoubleClick, onGenerateDLO, onGenerateDMO, isSearchMatch, dimmed } = props.data;
  const isSelected = props.selected;

  const hasLinkedDLO = false;
  const hasLinkedDMO = false;

  const typeStyle = useMemo(() => {
    const typeKey = entity.type in TYPE_STYLE_MAP ? entity.type : 'default';
    return TYPE_STYLE_MAP[typeKey as keyof typeof TYPE_STYLE_MAP];
  }, [entity.type]);

  const typeConfig = useMemo(() => {
    const typeKey = entity.type in TYPE_CONFIG_MAP ? entity.type : 'default';
    return TYPE_CONFIG_MAP[typeKey as keyof typeof TYPE_CONFIG_MAP];
  }, [entity.type]);

  const IconComponent = typeConfig.Icon;

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

  // FIX: Use w-80 (320px) which matches the NODE_WIDTH constant
  const cardClasses = `
    w-80 max-w-sm border-2 transition-all duration-150 ease-in-out
    shadow-md rounded-lg
    ${typeStyle.base} 
    ${isSelected ? `${typeStyle.selected} ring-4` : 'hover:shadow-lg'}
    nopan
    cursor-move
    ${dimmed ? 'opacity-30' : ''}
    ${isSearchMatch ? 'ring-4 ring-tertiary-500/50' : ''}
  `;

  const visibleFields = useMemo(() => entity.fields.slice(0, 8), [entity.fields]);
  const hiddenFieldCount = entity.fields.length > 8 ? entity.fields.length - 8 : 0;

  return (
    <Card
      className={cardClasses}
      onDoubleClick={handleDoubleClick}
      data-testid={`entity-node-${entity.id}`}
      data-handle-id={entity.id}
      style={{
        minHeight:
          NODE_HEADER_HEIGHT +
          METADATA_ROW_HEIGHT + // Account for metadata row
          SEPARATOR_HEIGHT +
          visibleFields.length * FIELD_ROW_HEIGHT +
          (hiddenFieldCount > 0 ? FIELD_ROW_HEIGHT : 0),
      }}
    >
      <Handle
        id="entity-target"
        type="target"
        position={Position.Left}
        style={{ top: '12%', opacity: 0 }}
      />
      <Handle
        id="entity-source"
        type="source"
        position={Position.Right}
        style={{ top: '12%', opacity: 0 }}
      />
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

      {/* Card Header: h-[48px] matches NODE_HEADER_HEIGHT */}
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between h-[48px] border-b border-coolgray-200">
        <IconComponent className={`h-5 w-5 flex-shrink-0 ${typeConfig.IconColorClass} mr-2`} />
        <h3 className="font-bold text-sm text-coolgray-700 truncate max-w-[50%] flex-1">
          {entity.name}
        </h3>
        <Badge
          variant="default"
          className={`text-xs ml-4 py-0.5 whitespace-nowrap ${typeConfig.BadgeColorClass} px-2`}
        >
          {typeConfig.BadgeText}
        </Badge>
      </CardHeader>

      {/* Metadata Row: FIX - Enforce h-8 (32px) to match METADATA_ROW_HEIGHT */}
      <div className="px-4 py-2 border-b border-coolgray-200 text-xs text-coolgray-600 h-8 flex items-center">
        {entity.type === 'data-stream' && entity.dataCloudMetadata?.streamConfig && (
          <div className="flex gap-2">
            <span>{entity.dataCloudMetadata.streamConfig.refreshType}</span>
            <span>•</span>
            <span>{entity.dataCloudMetadata.streamConfig.schedule}</span>
          </div>
        )}
        {entity.type === 'dlo' && entity.sourceDataStreamId && (
          <div>
            <span>Source: Data Stream</span>
          </div>
        )}
        {entity.type === 'dmo' && (
          <div className="flex gap-2">
            {entity.sourceDLOIds && entity.sourceDLOIds.length > 0 && (
              <>
                <span>
                  Sources: {entity.sourceDLOIds.length} DLO
                  {entity.sourceDLOIds.length > 1 ? 's' : ''}
                </span>
                <span>•</span>
              </>
            )}
            <span>{entity.dataCloudMetadata?.profileObjectType || 'TBD'}</span>
          </div>
        )}
      </div>

      <Separator className="bg-coolgray-200" />

      {/* Card Content: Field Rows h-8 (32px) matches FIELD_ROW_HEIGHT */}
      <CardContent className="p-0 text-xs">
        {entity.fields.map((field: Field, index: number) => {
          if (index >= 8) {
            return null;
          }
          const yPos = getFieldHandleYPosition(index);
          const isTarget = true;
          const isSource = true;

          return (
            <div
              key={field.id}
              className={`flex items-center justify-between px-3 py-1.5 border-b border-coolgray-100 
              ${typeStyle.hover} transition-colors h-8`}
              data-field-id={field.id}
            >
              <span className="truncate">{field.name}</span>
              <span className="text-coolgray-400 font-mono text-[10px] uppercase ml-2">
                {field.type.slice(0, 5)}
              </span>

              {isTarget && (
                <Handle
                  id={`field-target-${field.id}`}
                  type="target"
                  position={Position.Left}
                  style={{ top: yPos, opacity: 0 }}
                  className="w-3 h-3 bg-secondary-500 border-2 border-secondary-100 absolute"
                />
              )}

              {isSource && (
                <Handle
                  id={`field-source-${field.id}`}
                  type="source"
                  position={Position.Right}
                  style={{ top: yPos, opacity: 0 }}
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

      {/* Auto-generation buttons */}
      {entity.type === 'data-stream' && !hasLinkedDLO && onGenerateDLO && (
        <div className="px-4 py-2 border-t border-coolgray-200">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateDLO();
            }}
            className="w-full text-tertiary-700 border-tertiary-300 hover:bg-tertiary-50"
            data-testid="button-generate-dlo"
          >
            <Wand className="h-4 w-4 mr-1" />
            Generate DLO
          </Button>
        </div>
      )}

      {entity.type === 'dlo' && !hasLinkedDMO && onGenerateDMO && (
        <div className="px-4 py-2 border-t border-coolgray-200">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateDMO();
            }}
            className="w-full text-primary-700 border-primary-300 hover:bg-primary-50"
            data-testid="button-generate-dmo"
          >
            <Wand className="h-4 w-4 mr-1" />
            Generate DMO
          </Button>
        </div>
      )}
    </Card>
  );
};

export default React.memo(EntityNode);
