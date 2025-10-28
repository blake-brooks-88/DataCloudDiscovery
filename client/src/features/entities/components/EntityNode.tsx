import {
  Key,
  Link as LinkIcon,
  Lock,
  Waves,
  Cylinder,
  Layers,
  Database,
  Sparkles,
  Wand,
} from 'lucide-react';
import type { Entity } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getEntityCardStyle } from '@/styles/dataCloudStyles';

export interface EntityNodeProps {
  entity: Entity;
  isSelected: boolean;
  isSearchMatch?: boolean;
  dimmed?: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrag: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDoubleClick: () => void;
  style?: React.CSSProperties;
  onGenerateDLO?: (entityId: string) => void;
  onGenerateDMO?: (entityId: string) => void;
  hasLinkedDLO?: boolean;
  hasLinkedDMO?: boolean;
}

export default function EntityNode({
  entity,
  isSelected,
  isSearchMatch = false,
  dimmed = false,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  onDoubleClick,
  style,
  onGenerateDLO,
  onGenerateDMO,
  hasLinkedDLO = false,
  hasLinkedDMO = false,
}: EntityNodeProps) {
  const visibleFields = entity.fields.filter((f) => f.visibleInERD !== false);
  const pkFields = visibleFields.filter((f) => f.isPK);
  const fkFields = visibleFields.filter((f) => f.isFK);
  const regularFields = visibleFields.filter((f) => !f.isPK && !f.isFK);

  const cardStyle = getEntityCardStyle(entity.type);

  const IconComponent =
    {
      Database: Database,
      Waves: Waves,
      Cylinder: Cylinder,
      Layers: Layers,
      Sparkles: Sparkles,
    }[cardStyle.icon] || Database;

  // Generate unique class name for this entity
  const bgClass = `entity-bg-${entity.id}`;

  return (
    <>
      <style>{`.${bgClass} { background-color: ${cardStyle.background} !important; }`}</style>
      <div
        draggable
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        style={{
          ...style,
          borderColor: cardStyle.borderColor,
          borderWidth: '2px',
          borderStyle: 'solid',
        }}
        className={`${bgClass} absolute rounded-xl shadow-md cursor-move select-none transition-all
          ${isSelected ? 'ring-4 ring-offset-2 shadow-lg' : ''}
          ${isSearchMatch ? 'pulse-ring ring-4' : ''}
          ${dimmed ? 'opacity-30' : ''}
          hover:shadow-lg`}
        data-testid={`entity-node-${entity.id}`}
      >
        <div className="w-[320px]">
          <div className="px-4 py-3 border-b border-coolgray-200 flex items-center gap-2">
            <IconComponent
              className="h-5 w-5 flex-shrink-0"
              style={{ color: cardStyle.borderColor }}
            />
            <h3 className="text-[18px] font-semibold text-coolgray-700 break-words flex-1">
              {entity.name}
            </h3>
            <Badge
              variant={cardStyle.badge.color === 'secondary' ? 'secondary' : 'default'}
              className="text-[12px] px-2 py-[2px]"
              data-testid={`badge-${entity.type}`}
            >
              {cardStyle.badge.text}
            </Badge>
          </div>

          {/* Metadata row */}
          <div className="px-4 py-2 border-b border-coolgray-200 text-[12px] text-coolgray-600">
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
            {entity.dataSource && entity.type === 'dmo' && (
              <div className="text-[12px] text-coolgray-500 font-mono">{entity.dataSource}</div>
            )}
          </div>

          {/* Fields preview */}
          <div className="px-4 py-2 max-h-[240px] overflow-y-auto">
            {pkFields.length > 0 && (
              <div className="mb-2">
                {pkFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2 py-1 text-[14px]">
                    <Key className="h-3 w-3 text-primary-500 flex-shrink-0" />
                    <span className="font-mono text-coolgray-700 font-medium">{field.name}</span>
                    <span className="text-[12px] text-coolgray-500">{field.type}</span>
                    {field.containsPII && (
                      <Lock className="h-3 w-3 text-warning-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {fkFields.length > 0 && (
              <div className="mb-2">
                {fkFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2 py-1 text-[14px]">
                    <LinkIcon className="h-3 w-3 text-secondary-500 flex-shrink-0" />
                    <span className="font-mono text-coolgray-700">{field.name}</span>
                    <span className="text-[12px] text-coolgray-500">{field.type}</span>
                    {field.containsPII && (
                      <Lock className="h-3 w-3 text-warning-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {regularFields.length > 0 && (
              <div>
                {regularFields.slice(0, 8).map((field) => (
                  <div key={field.id} className="flex items-center gap-2 py-1 text-[14px]">
                    <div className="w-3 flex-shrink-0" />
                    <span className="font-mono text-coolgray-600">{field.name}</span>
                    <span className="text-[12px] text-coolgray-500">{field.type}</span>
                    {field.containsPII && (
                      <Lock className="h-3 w-3 text-warning-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {regularFields.length > 8 && (
                  <p className="text-[12px] text-coolgray-500 mt-1 pl-5">
                    +{regularFields.length - 8} more fields
                  </p>
                )}
              </div>
            )}

            {visibleFields.length === 0 && (
              <p className="text-[12px] text-coolgray-400 py-2 text-center">No visible fields</p>
            )}
          </div>

          {/* Auto-generation buttons */}
          {entity.type === 'data-stream' && !hasLinkedDLO && onGenerateDLO && (
            <div className="px-4 py-2 border-t border-coolgray-200">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateDLO(entity.id);
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
                  onGenerateDMO(entity.id);
                }}
                className="w-full text-primary-700 border-primary-300 hover:bg-primary-50"
                data-testid="button-generate-dmo"
              >
                <Wand className="h-4 w-4 mr-1" />
                Generate DMO
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
