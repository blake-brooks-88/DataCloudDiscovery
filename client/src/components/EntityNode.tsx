import { Key, Link as LinkIcon, Lock } from "lucide-react";
import type { Entity, SourceSystem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface EntityNodeProps {
  entity: Entity;
  sourceSystem?: SourceSystem;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrag: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDoubleClick: () => void;
  style?: React.CSSProperties;
}

export default function EntityNode({
  entity,
  sourceSystem,
  isSelected,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  onDoubleClick,
  style,
}: EntityNodeProps) {
  const visibleFields = entity.fields.filter(f => f.visibleInERD !== false);
  const pkFields = visibleFields.filter(f => f.isPK);
  const fkFields = visibleFields.filter(f => f.isFK);
  const regularFields = visibleFields.filter(f => !f.isPK && !f.isFK);

  const getSourceColor = (type: string) => {
    const colors: Record<string, string> = {
      salesforce: 'bg-info-50 text-info-700 border-info-500',
      database: 'bg-secondary-50 text-secondary-700 border-secondary-500',
      api: 'bg-tertiary-50 text-tertiary-700 border-tertiary-500',
      csv: 'bg-warning-50 text-warning-700 border-warning-500',
      erp: 'bg-primary-50 text-primary-700 border-primary-500',
      marketing_tool: 'bg-success-50 text-success-700 border-success-500',
      custom: 'bg-coolgray-100 text-coolgray-700 border-coolgray-400',
    };
    return colors[type] || colors.custom;
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      style={style}
      className={`absolute bg-white rounded-xl shadow-md cursor-move select-none transition-all
        ${isSelected ? 'border-2 border-secondary-500 shadow-lg' : 'border border-coolgray-200'}
        hover:shadow-lg`}
      data-testid={`entity-node-${entity.id}`}
    >
      <div className="min-w-64 max-w-80">
        <div className="bg-coolgray-50 px-4 py-3 border-b border-coolgray-200 rounded-t-xl">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-coolgray-600 break-words">{entity.name}</h3>
            {sourceSystem && (
              <Badge className={`text-xs px-2 py-0.5 rounded-full border ${getSourceColor(sourceSystem.type)}`}>
                {sourceSystem.type}
              </Badge>
            )}
          </div>
          {sourceSystem?.name && (
            <p className="text-xs text-coolgray-500 mt-1 font-mono">{sourceSystem.name}</p>
          )}
        </div>

        <div className="px-4 py-2 max-h-80 overflow-y-auto">
          {pkFields.length > 0 && (
            <div className="mb-2">
              {pkFields.map((field) => (
                <div key={field.id} className="flex items-center gap-2 py-1 text-sm">
                  <Key className="h-3 w-3 text-primary-500 flex-shrink-0" />
                  <span className="font-mono text-coolgray-700 font-medium">{field.name}</span>
                  <span className="text-xs text-coolgray-500">{field.type}</span>
                  {field.containsPII && <Lock className="h-3 w-3 text-warning-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {fkFields.length > 0 && (
            <div className="mb-2">
              {fkFields.map((field) => (
                <div key={field.id} className="flex items-center gap-2 py-1 text-sm">
                  <LinkIcon className="h-3 w-3 text-secondary-500 flex-shrink-0" />
                  <span className="font-mono text-coolgray-700">{field.name}</span>
                  <span className="text-xs text-coolgray-500">{field.type}</span>
                  {field.containsPII && <Lock className="h-3 w-3 text-warning-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {regularFields.length > 0 && (
            <div>
              {regularFields.slice(0, 10).map((field) => (
                <div key={field.id} className="flex items-center gap-2 py-1 text-sm">
                  <div className="w-3 flex-shrink-0" />
                  <span className="font-mono text-coolgray-600">{field.name}</span>
                  <span className="text-xs text-coolgray-500">{field.type}</span>
                  {field.containsPII && <Lock className="h-3 w-3 text-warning-500 flex-shrink-0" />}
                </div>
              ))}
              {regularFields.length > 10 && (
                <p className="text-xs text-coolgray-500 mt-1 pl-5">
                  +{regularFields.length - 10} more fields
                </p>
              )}
            </div>
          )}

          {visibleFields.length === 0 && (
            <p className="text-xs text-coolgray-400 py-2 text-center">No visible fields</p>
          )}
        </div>

        {entity.dataCloudIntent && (
          <div className="px-4 py-2 border-t border-coolgray-200 bg-coolgray-50 rounded-b-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-coolgray-500">Data Cloud:</span>
              <Badge className="text-xs px-2 py-0.5 bg-tertiary-50 text-tertiary-700 border border-tertiary-500 rounded-full">
                {entity.dataCloudIntent.objectType}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
