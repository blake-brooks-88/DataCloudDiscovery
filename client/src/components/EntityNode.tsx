import { Key, Link as LinkIcon, Lock } from "lucide-react";
import type { Entity } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface EntityNodeProps {
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
}: EntityNodeProps) {
  const visibleFields = entity.fields.filter(f => f.visibleInERD !== false);
  const pkFields = visibleFields.filter(f => f.isPK);
  const fkFields = visibleFields.filter(f => f.isFK);
  const regularFields = visibleFields.filter(f => !f.isPK && !f.isFK);

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
        ${isSearchMatch ? 'pulse-ring border-2 border-secondary-500' : ''}
        ${dimmed ? 'opacity-30' : ''}
        hover:shadow-lg`}
      data-testid={`entity-node-${entity.id}`}
    >
      <div className="min-w-64 max-w-80">
        <div className="bg-coolgray-50 px-4 py-3 border-b border-coolgray-200 rounded-t-xl">
          <h3 className="text-lg font-semibold text-coolgray-600 break-words">{entity.name}</h3>
          {entity.dataSource && (
            <p className="text-xs text-coolgray-500 mt-1 font-mono">{entity.dataSource}</p>
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
