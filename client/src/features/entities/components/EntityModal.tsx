import { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Link as LinkIcon, Lock, Eye, EyeOff, Edit } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type {
  Entity,
  Field,
  FieldType,
  EntityType,
  DataSource,
  Relationship,
} from '@shared/schema';
import { getEntityCardStyle } from '@/styles/dataCloudStyles';

/**
 * Interface for EntityModal component props.
 */
export interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
  entities: Entity[];
  dataSources: DataSource[];
  relationships?: Relationship[];
  onSave: (entity: Partial<Entity>) => void;
  // NEW PROP: Callback to update a specific field on the entity.
  // This will be used by the RelationshipBuilder to save FK data.
  onUpdateField: (entityId: string, fieldId: string, updates: Partial<Field>) => void;
  onCreateDataSource: (dataSource: Partial<DataSource>) => void;
  onOpenRelationshipBuilder?: (prefilledEntityId?: string) => void;
  onEditRelationship?: (relationship: Relationship) => void;
}

/**
 * A modal dialog for creating or editing an entity.
 */
export default function EntityModal({
  isOpen,
  onClose,
  entity,
  entities,
  dataSources,
  relationships,
  onSave,
  onOpenRelationshipBuilder,
  onEditRelationship,
}: EntityModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('dmo');
  const [dataSource, setDataSource] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [fields, setFields] = useState<Field[]>([]);

  // Data Cloud metadata state remains the same...
  const [profileObjectType, setProfileObjectType] = useState<
    'Profile' | 'Engagement' | 'Other' | 'TBD'
  >('TBD');
  const [apiName, setApiName] = useState('');
  const [refreshType, setRefreshType] = useState<'full' | 'incremental'>('full');
  const [schedule, setSchedule] = useState<'real-time' | 'hourly' | 'daily' | 'weekly' | 'custom'>(
    'daily'
  );
  const [dataSourceId, setDataSourceId] = useState('');
  const [sourceObjectName, setSourceObjectName] = useState('');
  type DataStreamDraft = {
    name?: string;
    dataSourceId?: string;
    sourceObjectName?: string;
    refreshType?: 'full' | 'incremental';
    schedule?: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'custom';
    apiName?: string;
    fields?: Field[];
  };

  // useEffect for resetting form state remains the same...
  useEffect(() => {
    if (entity) {
      setName(entity.name || '');
      setEntityType(entity.type || 'dmo');
      setDataSource(entity.dataSource || '');
      setBusinessPurpose(entity.businessPurpose || '');
      setFields(entity.fields || []);
      setProfileObjectType(entity.dataCloudMetadata?.profileObjectType || 'TBD');
      setApiName(entity.dataCloudMetadata?.apiName || '');
      setRefreshType(entity.dataCloudMetadata?.streamConfig?.refreshType || 'full');
      setSchedule(entity.dataCloudMetadata?.streamConfig?.schedule || 'daily');
      setDataSourceId(entity.dataCloudMetadata?.streamConfig?.dataSourceId || '');
      setSourceObjectName(entity.dataCloudMetadata?.streamConfig?.sourceObjectName || '');
    } else if (activeTab === 'details' && entityType === 'data-stream') {
      const draftsJSON = localStorage.getItem('dataStreamDrafts');
      if (draftsJSON) {
        try {
          const drafts = JSON.parse(draftsJSON) as Record<string, DataStreamDraft>;
          const draft = drafts['currentDraft'];
          if (draft) {
            setName(draft.name || '');
            setDataSourceId(draft.dataSourceId || '');
            setSourceObjectName(draft.sourceObjectName || '');
            setRefreshType(draft.refreshType || 'full');
            setSchedule(draft.schedule || 'daily');
            setApiName(draft.apiName || '');
            setFields(draft.fields || []);
          }
        } catch (e) {
          console.error('Failed to parse data stream draft from localStorage', e);
        }
      }
    } else {
      setName('');
      setEntityType('dmo');
      setDataSource('');
      setBusinessPurpose('');
      setFields([]);
      setProfileObjectType('TBD');
      setApiName('');
      setRefreshType('full');
      setSchedule('daily');
      setDataSourceId('');
      setSourceObjectName('');
    }
  }, [entity, isOpen, activeTab, entityType]);

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
  };

  const handleFieldChange = (fieldId: string, updates: Partial<Field>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const handleSave = () => {
    const updatedEntity: Partial<Entity> = {
      ...(entity?.id && { id: entity.id }),
      name,
      type: entityType,
      dataSource,
      businessPurpose,
      fields,
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

              <div>
                <Label htmlFor="entity-type" className="text-[14px] font-medium text-coolgray-500">
                  Entity Type *
                </Label>
                <Select
                  value={entityType}
                  onValueChange={(value) => setEntityType(value as EntityType)}
                >
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

              {/* Conditional fields based on entityType remain the same... */}
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
                      className="mt-1 border-coolgray-200 focus:border-secondary-500"
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
                      onValueChange={(value) =>
                        setProfileObjectType(value as typeof profileObjectType)
                      }
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
                    <Select value={dataSourceId} onValueChange={(value) => setDataSourceId(value)}>
                      <SelectTrigger
                        className="mt-1 border-coolgray-200"
                        data-testid="select-data-source"
                      >
                        <SelectValue placeholder="Select data source..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-coolgray-200">
                        {dataSources.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>
                            {ds.name} ({ds.type})
                          </SelectItem>
                        ))}
                        {dataSources.length === 0 && (
                          <div className="px-2 py-[6px] text-[12px] text-coolgray-400">
                            No data sources yet
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-[12px] text-coolgray-400 mt-1">
                      Select the external system (Salesforce, Marketing Cloud, etc.)
                    </p>
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
                      placeholder="e.g., Account, Contact"
                      className="mt-1 border-coolgray-200 focus:border-secondary-500"
                      data-testid="input-source-object-name"
                    />
                    <p className="text-[12px] text-coolgray-400 mt-1">
                      The table/object name from the selected data source
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
                      onValueChange={(value) => setRefreshType(value as typeof refreshType)}
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
                    <Select onValueChange={(value) => setSchedule(value as typeof schedule)}>
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
                      placeholder="e.g., Account_Stream"
                      className="mt-1 border-coolgray-200 focus:border-secondary-500"
                      data-testid="input-api-name"
                    />
                  </div>
                </>
              )}

              {(entityType === 'dlo' || entityType === 'dmo') && (
                <div>
                  <Label htmlFor="api-name" className="text-[14px] font-medium text-coolgray-500">
                    API Name
                  </Label>
                  <Input
                    id="api-name"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder={`e.g., ${name.replace(/\s+/g, '_')}_${entityType.toUpperCase()}`}
                    className="mt-1 border-coolgray-200 focus:border-secondary-500"
                    data-testid="input-api-name"
                  />
                </div>
              )}

              {entityType === 'dmo' && (
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
                    placeholder="Describe the business purpose of this entity..."
                    className="mt-1 border-coolgray-200 focus:border-secondary-500"
                    rows={2}
                    data-testid="textarea-business-purpose"
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
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-2 max-h-[384px] overflow-y-auto">
                {fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    entities={entities}
                    currentEntityId={entity?.id}
                    currentEntityType={entityType}
                    onUpdate={(updates) => handleFieldChange(field.id, updates)}
                    onRemove={() => handleRemoveField(field.id)}
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

          {/* --- Relationships Tab --- */}
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
                      <Plus className="h-4 w-4 mr-1" />
                      Add Relationship
                    </Button>
                  )}
                </div>

                {/* Relationship list remains the same... */}
                {relationships &&
                relationships.filter(
                  (r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
                ).length > 0 ? (
                  <div className="space-y-2">
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
                                        />
                                        <span className="font-medium text-coolgray-700">
                                          {entity.name}
                                        </span>
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
                                        />
                                        <span className="text-coolgray-600">
                                          {otherEntity?.name || 'Unknown'}
                                        </span>
                                        <span className="text-coolgray-400">
                                          ({otherEntity?.type || 'unknown'})
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
                                        />
                                        <span className="text-coolgray-600">
                                          {otherEntity?.name || 'Unknown'}
                                        </span>
                                        <span className="text-coolgray-400">
                                          ({otherEntity?.type || 'unknown'})
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
                                        />
                                        <span className="font-medium text-coolgray-700">
                                          {entity.name}
                                        </span>
                                        <span className="text-coolgray-400">({entity.type})</span>
                                      </div>
                                    </>
                                  )}
                                </div>
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
                              {onEditRelationship && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditRelationship(rel)}
                                  className="text-coolgray-500 hover:text-coolgray-700"
                                  data-testid={`button-edit-relationship-${rel.id}`}
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
                      Click &quot;Add Relationship&quot; to connect this entity to others
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* --- Footer Buttons --- */}
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

/**
 * A sub-component for rendering a single field row within the EntityModal.
 */
interface FieldRowProps {
  field: Field;
  entities: Entity[];
  currentEntityId?: string;
  currentEntityType: EntityType;
  onUpdate: (updates: Partial<Field>) => void;
  onRemove: () => void;
}

function FieldRow({ field, entities, onUpdate, onRemove }: FieldRowProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  // REMOVED: State for showing FK config is no longer needed
  // const [showFKConfig, setShowFKConfig] = useState(false);

  // Users cannot create a foreign key relationship to the entity itself.
  // This logic is moved to RelationshipBuilder
  // const availableEntities = entities.filter((e) => e.id !== currentEntityId);

  return (
    <div className="border border-coolgray-200 rounded-xl p-3 space-y-3 bg-coolgray-50">
      <div className="grid grid-cols-12 gap-2 items-start">
        <div className="col-span-3">
          <Input
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Field name"
            className="text-[14px] border-coolgray-200 font-mono"
            data-testid={`input-field-name-${field.id}`}
          />
        </div>

        <div className="col-span-2">
          <Select
            value={field.type}
            onValueChange={(value) => onUpdate({ type: value as FieldType })}
          >
            <SelectTrigger
              className="text-[14px] border-coolgray-200"
              data-testid={`select-field-type-${field.id}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-coolgray-200">
              <SelectItem value="string">string</SelectItem>
              <SelectItem value="text">text</SelectItem>
              <SelectItem value="int">int</SelectItem>
              <SelectItem value="float">float</SelectItem>
              <SelectItem value="boolean">boolean</SelectItem>
              <SelectItem value="date">date</SelectItem>
              <SelectItem value="datetime">datetime</SelectItem>
              <SelectItem value="uuid">uuid</SelectItem>
              <SelectItem value="email">email</SelectItem>
              <SelectItem value="phone">phone</SelectItem>
              {/* Add other types as needed */}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-6 flex items-center gap-2">
          <label className="flex items-center gap-1 text-[12px] text-coolgray-600">
            <Checkbox
              checked={field.isPK}
              onCheckedChange={(checked) => onUpdate({ isPK: checked as boolean })}
              data-testid={`checkbox-pk-${field.id}`}
            />
            <Key className="h-3 w-3 text-primary-500" />
            PK
          </label>
          <label className="flex items-center gap-1 text-[12px] text-coolgray-600">
            {/* REMOVED: FK Checkbox - FKs are now managed by RelationshipBuilder */}
            <LinkIcon className="h-3 w-3 text-secondary-500" />
            FK
            {field.isFK && field.fkReference && (
              <span className="ml-1 text-[10px] text-coolgray-400 italic">
                (references{' '}
                {entities.find((e) => e.id === field.fkReference?.targetEntityId)?.name || '...'})
              </span>
            )}
          </label>
          <label className="flex items-center gap-1 text-[12px] text-coolgray-600">
            <Checkbox
              checked={!!field.containsPII} // Ensure boolean
              onCheckedChange={(checked) => onUpdate({ containsPII: checked as boolean })}
              data-testid={`checkbox-pii-${field.id}`}
            />
            <Lock className="h-3 w-3 text-warning-500" />
            PII
          </label>
          <label className="flex items-center gap-1 text-[12px] text-coolgray-600">
            <Checkbox
              checked={field.visibleInERD !== false}
              onCheckedChange={(checked) => onUpdate({ visibleInERD: checked as boolean })}
              data-testid={`checkbox-visible-erd-${field.id}`}
            />
            {field.visibleInERD !== false ? (
              <Eye className="h-3 w-3 text-secondary-500" />
            ) : (
              <EyeOff className="h-3 w-3 text-coolgray-400" />
            )}
            ERD
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[12px] text-secondary-500 hover:text-secondary-600"
          >
            {showAdvanced ? 'Less' : 'More'}
          </Button>
        </div>

        <div className="col-span-1 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-danger-500 hover:text-danger-700 hover:bg-danger-50"
            data-testid={`button-remove-field-${field.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* REMOVED: Entire Foreign Key Configuration section */}
      {/* The logic for creating 'references' relationships is now centralized */}
      {/* in the RelationshipBuilder modal. */}

      {/* Advanced section remains the same... */}
      {showAdvanced && (
        <div className="space-y-2 pt-2 border-t border-coolgray-200">
          <Input
            value={field.businessName || ''}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            placeholder="Business name"
            className="text-[14px] border-coolgray-200"
            data-testid={`input-business-name-${field.id}`}
          />
          <Textarea
            value={field.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Notes"
            className="text-[14px] border-coolgray-200"
            rows={2}
            data-testid={`textarea-notes-${field.id}`}
          />
          <div>
            <Label className="text-[12px] text-coolgray-600">Sample Values (pipe-separated)</Label>
            <Input
              value={field.sampleValues?.join(' | ') || ''}
              onChange={(e) => {
                const values = e.target.value
                  .split('|')
                  .map((v) => v.trim())
                  .filter((v) => v);
                onUpdate({
                  sampleValues: values.length > 0 ? values : undefined,
                });
              }}
              placeholder="e.g., value1 | value2 | value3"
              className="text-[14px] border-coolgray-200 mt-1"
              data-testid={`input-sample-values-${field.id}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
