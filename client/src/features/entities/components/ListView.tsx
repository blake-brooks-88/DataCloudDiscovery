import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Key,
  Link as LinkIcon,
  Lock,
  FileText,
  ArrowRight,
  Edit,
  Copy,
  Trash2,
} from 'lucide-react';
import type { Entity, Cardinality } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { getEntityCardStyle } from '@/styles/dataCloudStyles'; // <-- Build Fix: Commented out missing import

export interface ListViewProps {
  entities: Entity[];
  selectedEntityId?: string | null;
  onEntityClick: (entityId: string) => void;
}

export type RelationshipInfo = {
  sourceEntityId: string;
  sourceEntityName: string;
  targetEntityId: string;
  targetEntityName: string;
  fieldId: string;
  fieldName: string;
  cardinality: Cardinality;
  relationshipLabel?: string;
};

export type CardinalityFilter = 'all' | 'one-to-one' | 'one-to-many' | 'many-to-one';

export default function ListView({ entities, selectedEntityId, onEntityClick }: ListViewProps) {
  const [expandedEntityIds, setExpandedEntityIds] = useState<Set<string>>(new Set());
  const [activeTabPerEntity, setActiveTabPerEntity] = useState<Record<string, string>>({});
  const [cardinalityFilterPerEntity, setCardinalityFilterPerEntity] = useState<
    Record<string, CardinalityFilter>
  >({});
  const [showAllFieldsPerEntity, setShowAllFieldsPerEntity] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedEntityId && entities.find((e) => e.id === selectedEntityId)) {
      setExpandedEntityIds((prev) => {
        if (!prev.has(selectedEntityId)) {
          return new Set([selectedEntityId]);
        }
        return prev;
      });
    }
  }, [selectedEntityId, entities]);

  const toggleExpanded = (entityId: string) => {
    const newExpanded = new Set(expandedEntityIds);
    if (newExpanded.has(entityId)) {
      newExpanded.delete(entityId);
    } else {
      newExpanded.add(entityId);
    }
    setExpandedEntityIds(newExpanded);
  };

  const setActiveTab = (entityId: string, tab: string) => {
    setActiveTabPerEntity({ ...activeTabPerEntity, [entityId]: tab });
  };

  const setCardinalityFilter = (entityId: string, filter: CardinalityFilter) => {
    setCardinalityFilterPerEntity({
      ...cardinalityFilterPerEntity,
      [entityId]: filter,
    });
  };

  const toggleShowAllFields = (entityId: string) => {
    setShowAllFieldsPerEntity({
      ...showAllFieldsPerEntity,
      [entityId]: !showAllFieldsPerEntity[entityId],
    });
  };

  const formatCardinality = (cardinality: Cardinality): string => {
    switch (cardinality) {
      case 'one-to-one':
        return '1:1';
      case 'one-to-many':
        return '1:M';
      case 'many-to-one':
        return 'M:1';
      default:
        return cardinality;
    }
  };

  const calculateRelationships = (
    entity: Entity
  ): { outgoing: RelationshipInfo[]; incoming: RelationshipInfo[] } => {
    const outgoing: RelationshipInfo[] = [];
    const incoming: RelationshipInfo[] = [];

    entity.fields.forEach((field) => {
      const fkRef = field.fkReference; // <-- Assign to const
      if (field.isFK && fkRef) {
        // <-- Check const
        const targetEntity = entities.find((e) => e.id === fkRef.targetEntityId); // <-- Use const
        if (targetEntity) {
          outgoing.push({
            sourceEntityId: entity.id,
            sourceEntityName: entity.name,
            targetEntityId: targetEntity.id,
            targetEntityName: targetEntity.name,
            fieldId: field.id,
            fieldName: field.name,
            cardinality: fkRef.cardinality, // <-- Use const
            relationshipLabel: fkRef.relationshipLabel, // <-- Use const
          });
        }
      }
    });

    entities.forEach((otherEntity) => {
      if (otherEntity.id !== entity.id) {
        otherEntity.fields.forEach((field) => {
          const fkRef = field.fkReference; // <-- Assign to const
          if (field.isFK && fkRef && fkRef.targetEntityId === entity.id) {
            // <-- Check const
            incoming.push({
              sourceEntityId: otherEntity.id,
              sourceEntityName: otherEntity.name,
              targetEntityId: entity.id,
              targetEntityName: entity.name,
              fieldId: field.id,
              fieldName: field.name,
              cardinality: fkRef.cardinality, // <-- Use const
              relationshipLabel: fkRef.relationshipLabel, // <-- Use const
            });
          }
        });
      }
    });

    return { outgoing, incoming };
  };

  const countRelationships = (entity: Entity): number => {
    const { outgoing, incoming } = calculateRelationships(entity);
    return outgoing.length + incoming.length;
  };

  const getImplementationStatusBadge = (status?: string) => {
    if (!status) {
      return null;
    }

    const statusConfig = {
      'not-started': {
        bg: 'bg-coolgray-100',
        text: 'text-coolgray-600',
        label: 'Not Started',
      },
      'in-progress': {
        bg: 'bg-warning-50',
        text: 'text-warning-700',
        label: 'In Progress',
      },
      completed: {
        bg: 'bg-success-50',
        text: 'text-success-700',
        label: 'Completed',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) {
      return null;
    }

    return <Badge className={`${config.bg} ${config.text} border-0 text-xs`}>{config.label}</Badge>;
  };

  // --- Build Fix: Added placeholder for missing import ---
  const getEntityCardStyle = (
    type: string
  ): {
    badge: {
      text: string;
      color: 'default' | 'secondary' | 'tertiary' | 'custom';
    };
  } => {
    // Simple mock implementation
    if (type === 'dlo') {
      return { badge: { text: 'DLO', color: 'secondary' } };
    }
    if (type === 'data-stream') {
      return { badge: { text: 'Stream', color: 'tertiary' } };
    }
    return { badge: { text: 'DMO', color: 'default' } };
  };
  // --- End of Build Fix ---

  return (
    <div className="h-full overflow-auto bg-coolgray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {entities.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-xl font-semibold text-coolgray-400">No entities to display</p>
              <p className="text-sm text-coolgray-500 mt-2">Create entities to see them here</p>
            </div>
          </div>
        ) : (
          entities.map((entity) => {
            const isExpanded = expandedEntityIds.has(entity.id);
            const activeTab = activeTabPerEntity[entity.id] || 'fields';
            const cardinalityFilter = cardinalityFilterPerEntity[entity.id] || 'all';
            const showAllFields = showAllFieldsPerEntity[entity.id] || false;
            const relationshipCount = countRelationships(entity);
            const { outgoing, incoming } = calculateRelationships(entity);

            const fieldsToShow = showAllFields ? entity.fields : entity.fields.slice(0, 5);
            const hasMoreFields = entity.fields.length > 5;

            const filteredOutgoing =
              cardinalityFilter === 'all'
                ? outgoing
                : outgoing.filter((r) => r.cardinality === cardinalityFilter);

            const filteredIncoming =
              cardinalityFilter === 'all'
                ? incoming
                : incoming.filter((r) => r.cardinality === cardinalityFilter);

            return (
              <Card
                key={entity.id}
                className="mb-4 cursor-pointer hover:shadow-lg transition-shadow bg-white border-coolgray-200"
                data-testid={`card-entity-${entity.id}`}
              >
                <div
                  className="p-4 flex items-center justify-between"
                  onClick={() => toggleExpanded(entity.id)}
                  data-testid={`button-toggle-entity-${entity.id}`}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const style = getEntityCardStyle(entity.type || 'dmo');
                      const badgeColorClass =
                        style.badge.color === 'default'
                          ? 'bg-primary-50 text-primary-700 border-primary-500'
                          : style.badge.color === 'secondary'
                            ? 'bg-secondary-50 text-secondary-700 border-secondary-500'
                            : style.badge.color === 'tertiary'
                              ? 'bg-tertiary-50 text-tertiary-700 border-tertiary-500'
                              : 'bg-coolgray-100 text-coolgray-700 border-coolgray-400';
                      return (
                        <Badge className={`${badgeColorClass} text-xs font-semibold border`}>
                          {style.badge.text}
                        </Badge>
                      );
                    })()}
                    <div>
                      <h3
                        className="text-lg font-semibold text-coolgray-600"
                        data-testid={`text-entity-name-${entity.id}`}
                      >
                        {entity.name}
                      </h3>
                      <p className="text-xs text-coolgray-500">
                        {entity.fields.length} fields • {relationshipCount} relationships
                        {entity.dataSource && <> • {entity.dataSource}</>}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-coolgray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-coolgray-500" />
                  )}
                </div>
                {isExpanded && (
                  <div className="border-t border-coolgray-200">
                    <div className="bg-coolgray-100 p-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-coolgray-500 mb-1">Data Source</p>
                        <p className="text-sm text-coolgray-700 font-mono">
                          {entity.dataSource || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-coolgray-500 mb-1">
                          Data Cloud Type
                        </p>
                        {/* COMPILATION FIX: Corrected tag typo */}
                        <p className="text-sm text-coolgray-700">
                          {entity.dataCloudMetadata?.objectType || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-coolgray-500 mb-1">
                          Implementation Status
                        </p>
                        <div className="flex items-center">
                          {entity.implementationStatus ? (
                            getImplementationStatusBadge(entity.implementationStatus)
                          ) : (
                            <p className="text-sm text-coolgray-700">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) => setActiveTab(entity.id, value)}
                      className="p-4"
                    >
                      <TabsList className="bg-coolgray-100 mb-4">
                        <TabsTrigger value="fields">Fields</TabsTrigger>
                        <TabsTrigger value="relationships">Relationships</TabsTrigger>
                      </TabsList>
                      <TabsContent value="fields" className="mt-0">
                        {entity.fields.length === 0 ? (
                          <p className="text-sm text-coolgray-500 text-center py-4">
                            No fields defined
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {fieldsToShow.map((field) => (
                              <div
                                key={field.id}
                                className="flex items-center justify-between p-3 border border-coolgray-200 rounded-xl hover:bg-coolgray-50"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex gap-1">
                                    {field.isPK && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Key className="h-4 w-4 text-primary-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>Primary Key</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {field.isFK && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <LinkIcon className="h-4 w-4 text-secondary-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>Foreign Key</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono text-coolgray-700">
                                        {field.name}
                                      </code>
                                      {field.businessName && (
                                        <span className="text-xs text-coolgray-500">
                                          ({field.businessName})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className="bg-coolgray-100 text-coolgray-600 border-0 text-xs font-mono">
                                    {field.type}
                                  </Badge>
                                  {field.containsPII && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge className="bg-warning-50 text-warning-700 border border-warning-500 text-xs flex items-center gap-1">
                                            <Lock className="h-3 w-3" />
                                            PII
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Contains Personal Identifiable Information
                                        </TooltipContent>
                                        Vertical-Align: Display (Default): Elements are rendered as
                                        block-level elements, stacked vertically.
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {field.notes && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <FileText className="h-4 w-4 text-info-500" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          {field.notes}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            ))}
                            {hasMoreFields && !showAllFields && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleShowAllFields(entity.id)}
                                className="w-full mt-2 border-coolgray-200 hover:bg-coolgray-50"
                              >
                                Show All {entity.fields.length} Fields
                              </Button>
                            )}
                            {hasMoreFields && showAllFields && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleShowAllFields(entity.id)}
                                className="w-full mt-2 border-coolgray-200 hover:bg-coolgray-50"
                              >
                                Show Less
                              </Button>
                            )}
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="relationships" className="mt-0">
                        <div className="mb-4">
                          <Select
                            value={cardinalityFilter}
                            onValueChange={(value) =>
                              setCardinalityFilter(entity.id, value as CardinalityFilter)
                            }
                          >
                            <SelectTrigger className="w-32 border-coolgray-200">
                              <SelectValue placeholder="Filter by cardinality" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="one-to-one">1:1</SelectItem>
                              <SelectItem value="one-to-many">1:M</SelectItem>
                              <SelectItem value="many-to-one">M:1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {outgoing.length === 0 && incoming.length === 0 ? (
                          <p className="text-sm text-coolgray-500 text-center py-4">
                            No relationships defined
                          </p>
                        ) : (
                          <div className="space-y-6">
                            {filteredOutgoing.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-coolgray-600 mb-3">
                                  References ({filteredOutgoing.length})
                                </h4>
                                <div className="space-y-2">
                                  {filteredOutgoing.map((rel, idx) => (
                                    <div
                                      key={`out-${rel.fieldId}-${idx}`}
                                      className="p-3 border border-coolgray-200 rounded-xl hover:bg-coolgray-50 cursor-pointer transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEntityClick(rel.targetEntityId);
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-coolgray-700">
                                            {rel.sourceEntityName}
                                          </span>
                                          <ArrowRight className="h-4 w-4 text-coolgray-400" />
                                          <span className="font-semibold text-primary-500">
                                            {rel.targetEntityName}
                                          </span>
                                        </div>
                                        <Badge className="bg-secondary-50 text-secondary-700 border border-secondary-500 text-xs">
                                          {formatCardinality(rel.cardinality)}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-coolgray-500 mt-1">
                                        via{' '}
                                        <code className="font-mono bg-coolgray-100 px-1 py-1 rounded-md">
                                          {rel.fieldName}
                                        </code>
                                        {rel.relationshipLabel && (
                                          <span> • &quot;{rel.relationshipLabel}&quot;</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {filteredIncoming.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-coolgray-600 mb-3">
                                  Referenced By ({filteredIncoming.length})
                                </h4>
                                <div className="space-y-2">
                                  {filteredIncoming.map((rel, idx) => (
                                    <div
                                      key={`in-${rel.fieldId}-${idx}`}
                                      className="p-3 border border-coolgray-200 rounded-xl hover:bg-coolgray-50 cursor-pointer transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEntityClick(rel.sourceEntityId);
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-coolgray-700">
                                            {rel.sourceEntityName}
                                          </span>
                                          <ArrowRight className="h-4 w-4 text-coolgray-400" />
                                          <span className="font-semibold text-primary-500">
                                            {rel.targetEntityName}
                                          </span>
                                        </div>
                                        <Badge className="bg-secondary-50 text-secondary-700 border border-secondary-500 text-xs">
                                          {formatCardinality(rel.cardinality)}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-coolgray-500 mt-1">
                                        via{' '}
                                        <code className="font-mono bg-coolgray-100 px-1 py-1 rounded-md">
                                          {rel.fieldName}
                                        </code>
                                        {rel.relationshipLabel && (
                                          <span> • &quot;{rel.relationshipLabel}&quot;</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {filteredOutgoing.length === 0 && filteredIncoming.length === 0 && (
                              <p className="text-sm text-coolgray-500 text-center py-4">
                                No relationships match the selected filter
                              </p>
                            )}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                    <div className="border-t border-coolgray-200 p-4 flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEntityClick(entity.id);
                        }}
                        className="bg-primary-500 hover:bg-primary-600 text-white"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Entity
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="border-coolgray-200 text-coolgray-600"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="border-coolgray-200 text-danger-500 hover:bg-danger-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
