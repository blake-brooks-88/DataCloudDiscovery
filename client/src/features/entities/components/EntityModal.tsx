import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type {
  Entity,
  Field,
  FieldMapping,
  EntityType,
  DataSource, // Re-added this import
  Relationship,
} from '@shared/schema';
import { getEntityCardStyle } from '@/styles/dataCloudStyles';
import { FieldRow } from './FieldRow';

/**
 * Interface for EntityModal component props.
 */
export interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
  entities: Entity[];
  dataSources: DataSource[]; // <-- FIX: Re-added this prop
  relationships?: Relationship[];
  onSave: (entity: Partial<Entity>) => void;
  // onUpdateField prop is not used here, so it's removed
  onUpdateFieldMappings: (entityId: string, fieldMappings: FieldMapping[]) => void;
  onCreateDataSource: (dataSource: Partial<DataSource>) => void;
  onOpenRelationshipBuilder?: (prefilledEntityId?: string) => void;
  onEditRelationship?: (relationship: Relationship) => void;
  onDeleteRelationship?: (relationshipId: string) => void;
}

/**
 * A modal dialog for creating or editing an entity.
 */
export default function EntityModal({
  isOpen,
  onClose,
  entity,
  entities,
  dataSources, // <-- FIX: Destructure the prop
  relationships,
  onSave,
  onUpdateFieldMappings,
  onOpenRelationshipBuilder,
  onEditRelationship,
  onDeleteRelationship,
}: EntityModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('dmo');
  const [dataSource, setDataSource] = useState(''); // This is for DMO's text field
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [currentFieldMappings, setCurrentFieldMappings] = useState<FieldMapping[]>([]);

  // Data Cloud metadata state
  const [profileObjectType, setProfileObjectType] = useState<
    'Profile' | 'Engagement' | 'Other' | 'TBD'
  >('TBD');
  const [apiName, setApiName] = useState('');
  const [refreshType, setRefreshType] = useState<'full' | 'incremental'>('full');
  const [schedule, setSchedule] = useState<'real-time' | 'hourly' | 'daily' | 'weekly' | 'custom'>(
    'daily'
  );
  const [dataSourceId, setDataSourceId] = useState(''); // This is for Data Stream's select
  const [sourceObjectName, setSourceObjectName] = useState('');

  // useEffect for resetting form state
  useEffect(() => {
    if (entity) {
      setName(entity.name || '');
      setEntityType(entity.type || 'dmo');
      setDataSource(entity.dataSource || '');
      setBusinessPurpose(entity.businessPurpose || '');
      setFields(entity.fields || []);
      setCurrentFieldMappings(entity.fieldMappings || []);
      setProfileObjectType(entity.dataCloudMetadata?.profileObjectType || 'TBD');
      setApiName(entity.dataCloudMetadata?.apiName || '');
      setRefreshType(entity.dataCloudMetadata?.streamConfig?.refreshType || 'full');
      setSchedule(entity.dataCloudMetadata?.streamConfig?.schedule || 'daily');
      // <-- FIX: Restore state for Data Stream config
      setDataSourceId(entity.dataCloudMetadata?.streamConfig?.dataSourceId || '');
      setSourceObjectName(entity.dataCloudMetadata?.streamConfig?.sourceObjectName || '');
    } else {
      setName('');
      setEntityType('dmo');
      setDataSource('');
      setBusinessPurpose('');
      setFields([]);
      setCurrentFieldMappings([]);
      setProfileObjectType('TBD');
      setApiName('');
      setRefreshType('full');
      setSchedule('daily');
      // <-- FIX: Restore state for Data Stream config
      setDataSourceId('');
      setSourceObjectName('');
    }
    if (isOpen) {
      setActiveTab('details');
    }
  }, [entity, isOpen]);

  const handleAddField = () => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: '',
      type: 'string',
      isPK: false,
      isFK: false,
      visibleInERD: true,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (entity) {
      const updatedMappings = currentFieldMappings.filter((fm) => fm.targetFieldId !== fieldId);
      setCurrentFieldMappings(updatedMappings);
      onUpdateFieldMappings(entity.id, updatedMappings);
    }
  };

  const handleFieldChange = (fieldId: string, updates: Partial<Field>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const handleUpdateMappingsLocalAndPropagate = (
    entityId: string,
    updatedMappings: FieldMapping[]
  ) => {
    setCurrentFieldMappings(updatedMappings);
    onUpdateFieldMappings(entityId, updatedMappings);
  };

  const handleSave = () => {
    const updatedEntity: Partial<Entity> = {
      ...(entity?.id && { id: entity.id }),
      name,
      type: entityType,
      dataSource,
      businessPurpose,
      fields,
      fieldMappings: currentFieldMappings,
      dataCloudMetadata: {
        ...(entityType === 'dmo' && { profileObjectType, objectType: 'DMO' as const }),
        ...(entityType === 'dlo' && { objectType: 'DLO' as const }),
        ...(entityType === 'data-stream' && {
          streamConfig: {
            refreshType,
            schedule,
            dataSourceId: dataSourceId || undefined,
            sourceObjectName,
          },
        }),
        apiName: apiName || undefined,
      },
      ...(entity?.position && { position: entity.position }),
      ...(entity?.sourceDataStreamId && { sourceDataStreamId: entity.sourceDataStreamId }),
      ...(entity?.sourceDLOIds && { sourceDLOIds: entity.sourceDLOIds }),
      ...(entity?.dataSourceId && { dataSourceId: entity.dataSourceId }),
    };
    onSave(updatedEntity);
  };

  // Maps relationship types to their theme colors
  const typeColors = {
    'feeds-into': 'bg-secondary-50 text-secondary-700 border-secondary-300',
    'transforms-to': 'bg-tertiary-50 text-tertiary-700 border-tertiary-300',
    references: 'bg-coolgray-100 text-coolgray-700 border-coolgray-300',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[896px] max-h-[90vh] overflow-hidden flex flex-col bg-white border-coolgray-200">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold text-coolgray-600">
            {entity ? 'Edit Entity' : 'Create New Entity'}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-6">
            <TabsTrigger value="details" data-testid="tab-details">
              Details
            </TabsTrigger>
            <TabsTrigger value="relationships" data-testid="tab-relationships">
              Relationships
              {entity &&
                relationships &&
                relationships.filter(
                  (r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
                ).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {
                      relationships.filter(
                        (r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
                      ).length
                    }
                  </Badge>
                )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-4 space-y-6 mt-0">
            {/* --- General Entity Details Section --- */}
            <div className="grid grid-cols-2 gap-4">
              {/* Name Input */}
              <div>
                <Label htmlFor="entity-name" className="text-[14px] font-medium text-coolgray-500">
                  Entity Name *
                </Label>
                <Input
                  id="entity-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Customer, Order"
                  className="mt-1 border-coolgray-200 focus:border-secondary-500"
                  data-testid="input-entity-name"
                />
              </div>
              {/* Type Select */}
              <div>
                <Label htmlFor="entity-type" className="text-[14px] font-medium text-coolgray-500">
                  Entity Type *
                </Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                  <SelectTrigger
                    className="mt-1 border-coolgray-200"
                    data-testid="select-entity-type"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-coolgray-200">
                    <SelectItem value="data-stream">Data Stream (Ingestion)</SelectItem>
                    <SelectItem value="dlo">DLO (Data Lake Object)</SelectItem>
                    <SelectItem value="dmo">DMO (Data Model Object)</SelectItem>
                    <SelectItem value="data-transform">Data Transform</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional fields based on entityType */}
              {entityType === 'dmo' && (
                <>
                  <div>
                    <Label
                      htmlFor="data-source"
                      className="text-[14px] font-medium text-coolgray-500"
                    >
                      Data Source
                    </Label>
                    <Input
                      id="data-source"
                      value={dataSource}
                      onChange={(e) => setDataSource(e.target.value)}
                      placeholder="e.g., Salesforce Production"
                      className="mt-1 border-coolgray-200"
                      data-testid="input-data-source"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="profile-object-type"
                      className="text-[14px] font-medium text-coolgray-500"
                    >
                      Profile Object Type
                    </Label>
                    <Select
                      value={profileObjectType}
                      onValueChange={(v) => setProfileObjectType(v as typeof profileObjectType)}
                    >
                      <SelectTrigger
                        className="mt-1 border-coolgray-200"
                        data-testid="select-profile-object-type"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-coolgray-200">
                        <SelectItem value="Profile">Profile</SelectItem>
                        <SelectItem value="Engagement">Engagement</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="TBD">TBD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="api-name" className="text-[14px] font-medium text-coolgray-500">
                      API Name
                    </Label>
                    <Input
                      id="api-name"
                      value={apiName}
                      onChange={(e) => setApiName(e.target.value)}
                      placeholder={`e.g., ${name.replace(/\s+/g, '_')}_DMO`}
                      className="mt-1 border-coolgray-200"
                      data-testid="input-api-name"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="business-purpose"
                      className="text-[14px] font-medium text-coolgray-500"
                    >
                      Business Purpose
                    </Label>
                    <Textarea
                      id="business-purpose"
                      value={businessPurpose}
                      onChange={(e) => setBusinessPurpose(e.target.value)}
                      placeholder="Describe..."
                      className="mt-1 border-coolgray-200"
                      rows={2}
                      data-testid="textarea-business-purpose"
                    />
                  </div>
                </>
              )}
              {entityType === 'data-stream' && (
                <>
                  <div>
                    <Label
                      htmlFor="data-source-select"
                      className="text-[14px] font-medium text-coolgray-500"
                    >
                      Data Source *
                    </Label>
                    <Select value={dataSourceId} onValueChange={setDataSourceId}>
                      <SelectTrigger
                        className="mt-1 border-coolgray-200"
                        data-testid="select-data-source"
                      >
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-coolgray-200">
                        {/* <-- FIX: Use the dataSources prop here */}
                        {dataSources.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>
                            {ds.name} ({ds.type})
                          </SelectItem>
                        ))}
                        {dataSources.length === 0 && (
                          <div className="px-2 py-1 text-xs text-coolgray-400">No data sources</div>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-coolgray-400 mt-1">Select the external system.</p>
                  </div>
                  <div>
                    <Label
                      htmlFor="source-object-name"
                      className="text-[14px] font-medium text-coolgray-500"
                    >
                      Source Object Name *
                    </Label>
                    <Input
                      id="source-object-name"
                      value={sourceObjectName}
                      onChange={(e) => setSourceObjectName(e.target.value)}
                      placeholder="e.g., Account"
                      className="mt-1 border-coolgray-200"
                      data-testid="input-source-object-name"
                    />
                    <p className="text-xs text-coolgray-400 mt-1">
                      The table/object name from the source.
                    </p>
                  </div>
                  <div>
                    <Label
                      htmlFor="refresh-type"
                      className="text-[14px] font-medium text-coolgray-500"
                    >
                      Refresh Type
                    </Label>
                    <Select
                      value={refreshType}
                      onValueChange={(v) => setRefreshType(v as typeof refreshType)}
                    >
                      <SelectTrigger
                        className="mt-1 border-coolgray-200"
                        data-testid="select-refresh-type"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-coolgray-200">
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="incremental">Incremental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="schedule" className="text-[14px] font-medium text-coolgray-500">
                      Schedule
                    </Label>
                    <Select
                      value={schedule}
                      onValueChange={(v) => setSchedule(v as typeof schedule)}
                    >
                      <SelectTrigger
                        className="mt-1 border-coolgray-200"
                        data-testid="select-schedule"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-coolgray-200">
                        <SelectItem value="real-time">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="api-name" className="text-[14px] font-medium text-coolgray-500">
                      API Name
                    </Label>
                    <Input
                      id="api-name"
                      value={apiName}
                      onChange={(e) => setApiName(e.target.value)}
                      placeholder={`e.g., ${name.replace(/\s+/g, '_')}_Stream`}
                      className="mt-1 border-coolgray-200"
                      data-testid="input-api-name"
                    />
                  </div>
                </>
              )}
              {entityType === 'dlo' && (
                <div>
                  <Label htmlFor="api-name" className="text-[14px] font-medium text-coolgray-500">
                    API Name
                  </Label>
                  <Input
                    id="api-name"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder={`e.g., ${name.replace(/\s+/g, '_')}_DLO`}
                    className="mt-1 border-coolgray-200"
                    data-testid="input-api-name"
                  />
                </div>
              )}
            </div>

            {/* --- Fields Section --- */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[14px] font-medium text-coolgray-600">Fields</Label>
                <Button
                  onClick={handleAddField}
                  size="sm"
                  className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl"
                  data-testid="button-add-field"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>

              <div className="space-y-2 max-h-[384px] overflow-y-auto">
                {fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    entity={entity}
                    entities={entities}
                    relationships={relationships || []}
                    entityFieldMappings={currentFieldMappings} // Pass local state
                    onUpdate={(updates) => handleFieldChange(field.id, updates)}
                    onRemove={() => handleRemoveField(field.id)}
                    onUpdateFieldMappings={handleUpdateMappingsLocalAndPropagate} // Pass wrapper
                    onDeleteRelationship={onDeleteRelationship}
                  />
                ))}
                {fields.length === 0 && (
                  <div className="text-center py-8 text-coolgray-400 text-[14px]">
                    No fields yet. Click &quot;Add Field&quot; to create one.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            {!entity ? (
              <div className="text-center py-12 text-coolgray-400">
                <LinkIcon className="h-[48px] w-[48px] mx-auto mb-3 opacity-30" />
                <p>Save the entity first to manage relationships</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-medium text-coolgray-600">
                    Entity Relationships
                  </h3>
                  {onOpenRelationshipBuilder && (
                    <Button
                      size="sm"
                      onClick={() => onOpenRelationshipBuilder(entity.id)}
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                      data-testid="button-add-relationship"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Relationship
                    </Button>
                  )}
                </div>

                {/* Relationship list rendering */}
                {relationships &&
                relationships.filter(
                  (r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
                ).length > 0 ? (
                  <div className="space-y-2">
                    {/* Map over relevant relationships */}
                    {relationships
                      .filter(
                        (r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
                      )
                      .map((rel) => {
                        const isSource = rel.sourceEntityId === entity.id;
                        const otherEntity = entities.find(
                          (e) => e.id === (isSource ? rel.targetEntityId : rel.sourceEntityId)
                        );
                        return (
                          <div
                            key={rel.id}
                            className="border border-coolgray-200 rounded-xl p-3 bg-white hover:bg-coolgray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                {/* Type Badge and Label */}
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={`text-[12px] ${typeColors[rel.type]}`}>
                                    {rel.type}
                                  </Badge>
                                  {rel.label && (
                                    <span className="text-[12px] text-coolgray-500 italic">
                                      &quot;{rel.label}&quot;
                                    </span>
                                  )}
                                </div>
                                {/* Source -> Target Display */}
                                <div className="flex items-center gap-2 text-[14px]">
                                  {isSource ? (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor: getEntityCardStyle(entity.type)
                                              .borderColor,
                                          }}
                                        />{' '}
                                        <span className="font-medium">{entity.name}</span>{' '}
                                        <span className="text-coolgray-400">({entity.type})</span>
                                      </div>
                                      <span className="text-coolgray-400">→</span>
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor: otherEntity
                                              ? getEntityCardStyle(otherEntity.type).borderColor
                                              : '#ccc',
                                          }}
                                        />{' '}
                                        <span>{otherEntity?.name || '?'}</span>{' '}
                                        <span className="text-coolgray-400">
                                          ({otherEntity?.type || '?'})
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor: otherEntity
                                              ? getEntityCardStyle(otherEntity.type).borderColor
                                              : '#ccc',
                                          }}
                                        />{' '}
                                        <span>{otherEntity?.name || '?'}</span>{' '}
                                        <span className="text-coolgray-400">
                                          ({otherEntity?.type || '?'})
                                        </span>
                                      </div>
                                      <span className="text-coolgray-400">→</span>
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor: getEntityCardStyle(entity.type)
                                              .borderColor,
                                          }}
                                        />{' '}
                                        <span className="font-medium">{entity.name}</span>{' '}
                                        <span className="text-coolgray-400">({entity.type})</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {/* Key Mappings Display */}
                                {rel.fieldMappings && rel.fieldMappings.length > 0 && (
                                  <div className="mt-2 text-[12px] text-coolgray-500">
                                    <span className="font-medium">Key mappings:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {rel.fieldMappings.map((fm, idx) => {
                                        const sourceField = (
                                          isSource ? entity : otherEntity
                                        )?.fields.find((f) => f.id === fm.sourceFieldId);
                                        const targetField = (
                                          isSource ? otherEntity : entity
                                        )?.fields.find((f) => f.id === fm.targetFieldId);
                                        return (
                                          <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-[12px]"
                                          >
                                            {sourceField?.name || '?'} → {targetField?.name || '?'}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Edit Button */}
                              {onEditRelationship && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditRelationship(rel)}
                                  className="text-coolgray-500 hover:text-coolgray-700"
                                  data-testid={`button-edit-${rel.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-coolgray-400 border border-dashed border-coolgray-200 rounded-xl">
                    <LinkIcon className="h-[48px] w-[48px] mx-auto mb-3 opacity-30" />
                    <p className="mb-2">No relationships defined yet</p>
                    <p className="text-[12px]">
                      Click &quot;Add Relationship&quot; to connect this entity
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Buttons */}
        <div className="border-t border-coolgray-200 px-6 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-coolgray-200 text-coolgray-600"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || fields.length === 0}
            className="bg-primary-500 hover:bg-primary-600 text-white"
            data-testid="button-save-entity"
          >
            {entity ? 'Update Entity' : 'Create Entity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
