import { useState, useEffect } from "react";
import { ArrowRight, Plus, Trash2, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Entity, Relationship, RelationshipType } from "@shared/schema";
import { getEntityCardStyle } from "@/lib/dataCloudStyles";

interface RelationshipBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  entities: Entity[];
  relationships: Relationship[];
  editingRelationship?: Relationship | null;
  onSaveRelationship: (relationship: Omit<Relationship, 'id'> | Relationship) => void;
  onDeleteRelationship?: (id: string) => void;
}

export default function RelationshipBuilder({
  isOpen,
  onClose,
  entities,
  relationships,
  editingRelationship,
  onSaveRelationship,
  onDeleteRelationship,
}: RelationshipBuilderProps) {
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('references');
  const [sourceEntityId, setSourceEntityId] = useState('');
  const [targetEntityId, setTargetEntityId] = useState('');
  const [label, setLabel] = useState('');
  const [fieldMappings, setFieldMappings] = useState<Array<{ sourceFieldId: string; targetFieldId: string }>>([]);

  useEffect(() => {
    if (editingRelationship) {
      setRelationshipType(editingRelationship.type);
      setSourceEntityId(editingRelationship.sourceEntityId);
      setTargetEntityId(editingRelationship.targetEntityId);
      setLabel(editingRelationship.label || '');
      setFieldMappings(editingRelationship.fieldMappings || []);
    } else {
      resetForm();
    }
  }, [editingRelationship]);

  const resetForm = () => {
    setRelationshipType('references');
    setSourceEntityId('');
    setTargetEntityId('');
    setLabel('');
    setFieldMappings([]);
  };

  const sourceEntity = entities.find(e => e.id === sourceEntityId);
  const targetEntity = entities.find(e => e.id === targetEntityId);

  const getValidTargetEntities = () => {
    if (!sourceEntityId) return [];

    const source = entities.find(e => e.id === sourceEntityId);
    if (!source) return [];

    switch (relationshipType) {
      case 'feeds-into':
        return entities.filter(e => source.type === 'data-stream' && e.type === 'dlo');
      case 'transforms-to':
        return entities.filter(e => (source.type === 'dlo' || source.type === 'dmo') && e.type === 'dmo');
      case 'references':
        return entities.filter(e => e.type === 'dmo' && e.id !== sourceEntityId);
      default:
        return entities.filter(e => e.id !== sourceEntityId);
    }
  };

  const getValidSourceEntities = () => {
    switch (relationshipType) {
      case 'feeds-into':
        return entities.filter(e => e.type === 'data-stream');
      case 'transforms-to':
        return entities.filter(e => e.type === 'dlo' || e.type === 'dmo');
      case 'references':
        return entities.filter(e => e.type === 'dmo');
      default:
        return entities;
    }
  };

  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { sourceFieldId: '', targetFieldId: '' }]);
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const updateFieldMapping = (index: number, field: 'sourceFieldId' | 'targetFieldId', value: string) => {
    const updated = [...fieldMappings];
    updated[index][field] = value;
    setFieldMappings(updated);
  };

  const handleSave = () => {
    if (!sourceEntityId || !targetEntityId) return;

    const relationship: Omit<Relationship, 'id'> | Relationship = {
      ...(editingRelationship?.id && { id: editingRelationship.id }),
      type: relationshipType,
      sourceEntityId,
      targetEntityId,
      label: label.trim() || undefined,
      fieldMappings: fieldMappings.length > 0 ? fieldMappings.filter(fm => fm.sourceFieldId && fm.targetFieldId) : undefined,
    };

    onSaveRelationship(relationship);
    onClose();
    resetForm();
  };

  const handleDelete = () => {
    if (editingRelationship?.id && onDeleteRelationship) {
      onDeleteRelationship(editingRelationship.id);
      onClose();
      resetForm();
    }
  };

  const getRelationshipTypeInfo = (type: RelationshipType) => {
    switch (type) {
      case 'feeds-into':
        return {
          name: 'Feeds Into',
          color: 'bg-blue-500',
          description: 'Data Stream → DLO (ingestion)',
          example: 'Contact_Stream feeds into Contact_DLO',
        };
      case 'transforms-to':
        return {
          name: 'Transforms To',
          color: 'bg-green-500',
          description: 'DLO/DMO → DMO (transformation)',
          example: 'Contact_DLO transforms to UnifiedContact_DMO',
        };
      case 'references':
        return {
          name: 'References',
          color: 'bg-gray-500',
          description: 'DMO → DMO (foreign key)',
          example: 'Order_DMO references Customer_DMO',
        };
    }
  };

  const canSave = sourceEntityId && targetEntityId && getValidTargetEntities().some(e => e.id === targetEntityId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-coolgray-600">
            <Link2 className="h-5 w-5" />
            {editingRelationship ? 'Edit Relationship' : 'Create Relationship'}
          </DialogTitle>
          <DialogDescription>
            Define how entities connect and transform data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-coolgray-600">Relationship Type *</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['feeds-into', 'transforms-to', 'references'] as RelationshipType[]).map((type) => {
                const info = getRelationshipTypeInfo(type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setRelationshipType(type);
                      setSourceEntityId('');
                      setTargetEntityId('');
                      setFieldMappings([]);
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      relationshipType === type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-coolgray-200 hover:border-coolgray-300'
                    }`}
                    data-testid={`button-type-${type}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-3 w-3 rounded-full ${info.color}`} />
                      <span className="font-semibold text-sm text-coolgray-600">{info.name}</span>
                    </div>
                    <p className="text-xs text-coolgray-500">{info.description}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-coolgray-400 italic">
              {getRelationshipTypeInfo(relationshipType).example}
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            <div className="space-y-2">
              <Label htmlFor="source-entity">Source Entity *</Label>
              <Select value={sourceEntityId} onValueChange={setSourceEntityId}>
                <SelectTrigger id="source-entity" data-testid="select-source-entity">
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {getValidSourceEntities().map((entity) => {
                    const style = getEntityCardStyle(entity.type);
                    return (
                      <SelectItem key={entity.id} value={entity.id}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full`} style={{ backgroundColor: style.borderColor }} />
                          {entity.name}
                          <span className="text-xs text-coolgray-400">({entity.type})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {sourceEntity && (
                <div className="mt-2 p-2 rounded bg-coolgray-50 border border-coolgray-200">
                  <div className="text-xs font-medium text-coolgray-600 mb-1">
                    {sourceEntity.fields.length} fields
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sourceEntity.fields.slice(0, 3).map(f => (
                      <Badge key={f.id} variant="outline" className="text-xs">
                        {f.name}
                      </Badge>
                    ))}
                    {sourceEntity.fields.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{sourceEntity.fields.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8">
              <ArrowRight className="h-5 w-5 text-coolgray-400" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-entity">Target Entity *</Label>
              <Select 
                value={targetEntityId} 
                onValueChange={setTargetEntityId}
                disabled={!sourceEntityId}
              >
                <SelectTrigger id="target-entity" data-testid="select-target-entity">
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  {getValidTargetEntities().map((entity) => {
                    const style = getEntityCardStyle(entity.type);
                    return (
                      <SelectItem key={entity.id} value={entity.id}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full`} style={{ backgroundColor: style.borderColor }} />
                          {entity.name}
                          <span className="text-xs text-coolgray-400">({entity.type})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  {sourceEntityId && getValidTargetEntities().length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-coolgray-400">
                      No valid targets for this relationship type
                    </div>
                  )}
                </SelectContent>
              </Select>
              {targetEntity && (
                <div className="mt-2 p-2 rounded bg-coolgray-50 border border-coolgray-200">
                  <div className="text-xs font-medium text-coolgray-600 mb-1">
                    {targetEntity.fields.length} fields
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {targetEntity.fields.slice(0, 3).map(f => (
                      <Badge key={f.id} variant="outline" className="text-xs">
                        {f.name}
                      </Badge>
                    ))}
                    {targetEntity.fields.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{targetEntity.fields.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-label">Relationship Label (optional)</Label>
            <Input
              id="relationship-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., 'sources from', 'belongs to', 'derives from'"
              data-testid="input-relationship-label"
            />
          </div>

          {sourceEntity && targetEntity && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-coolgray-600">
                  Field Mappings {relationshipType === 'transforms-to' && '(recommended)'}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFieldMapping}
                  data-testid="button-add-field-mapping"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Mapping
                </Button>
              </div>

              {fieldMappings.length === 0 ? (
                <p className="text-xs text-coolgray-400 text-center py-4">
                  No field mappings defined. Click "Add Mapping" to connect specific fields.
                </p>
              ) : (
                <div className="space-y-2">
                  {fieldMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={mapping.sourceFieldId}
                        onValueChange={(value) => updateFieldMapping(index, 'sourceFieldId', value)}
                      >
                        <SelectTrigger className="flex-1" data-testid={`select-source-field-${index}`}>
                          <SelectValue placeholder="Source field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceEntity.fields.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name} ({f.type})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ArrowRight className="h-4 w-4 text-coolgray-400 flex-shrink-0" />
                      <Select
                        value={mapping.targetFieldId}
                        onValueChange={(value) => updateFieldMapping(index, 'targetFieldId', value)}
                      >
                        <SelectTrigger className="flex-1" data-testid={`select-target-field-${index}`}>
                          <SelectValue placeholder="Target field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {targetEntity.fields.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name} ({f.type})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFieldMapping(index)}
                        className="flex-shrink-0"
                        data-testid={`button-remove-mapping-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <div>
              {editingRelationship && onDeleteRelationship && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-500 border-red-300 hover:bg-red-50"
                  data-testid="button-delete-relationship"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave}
                className="bg-primary-500 hover:bg-primary-600"
                data-testid="button-save-relationship"
              >
                {editingRelationship ? 'Update' : 'Create'} Relationship
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
