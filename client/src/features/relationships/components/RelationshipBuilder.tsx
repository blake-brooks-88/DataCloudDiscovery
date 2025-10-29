import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Plus, Trash2, Link2, Check, ChevronsUpDown, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import type { Entity, Field, Relationship, RelationshipType, Cardinality } from '@shared/schema';
import { getEntityCardStyle } from '@/styles/dataCloudStyles';
import { cn } from '@/lib/utils';
import { useRelationshipRules } from '../hooks/useRelationshipRules';

interface RelationshipBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  entities: Entity[];
  relationships: Relationship[];
  editingRelationship?: Relationship | null;
  prefilledSourceEntityId?: string | undefined;
  onSaveRelationship: (relationship: Omit<Relationship, 'id'> | Relationship) => void;
  onUpdateEntityField: (entityId: string, fieldId: string, updates: Partial<Field>) => void;
  onDeleteRelationship?: (id: string) => void;
}

export function RelationshipBuilder({
  isOpen,
  onClose,
  entities,
  relationships,
  editingRelationship,
  prefilledSourceEntityId,
  onSaveRelationship,
  onUpdateEntityField,
  onDeleteRelationship,
}: RelationshipBuilderProps) {
  // --- State ---
  const [entity1Id, setEntity1Id] = useState<string | undefined>(undefined);
  const [entity2Id, setEntity2Id] = useState<string | undefined>(undefined);
  const [relationshipType, setRelationshipType] = useState<RelationshipType | undefined>(undefined);

  const [fkSourceFieldId, setFkSourceFieldId] = useState<string | undefined>(undefined);
  const [fkTargetFieldId, setFkTargetFieldId] = useState<string | undefined>(undefined);
  const [cardinality, setCardinality] = useState<Cardinality>('many-to-one');

  const [label, setLabel] = useState('');
  const [fieldMappings, setFieldMappings] = useState<
    Array<{ sourceFieldId: string; targetFieldId: string }>
  >([]);

  const [entity1Open, setEntity1Open] = useState(false);
  const [entity2Open, setEntity2Open] = useState(false);

  // --- Logic from new Hook ---
  const { entity1, entity2, allowedRelationshipTypes, validation } = useRelationshipRules(
    entities,
    relationships,
    entity1Id,
    entity2Id
  );

  // Effect to handle pre-filling Entity 1 and resetting state
  useEffect(() => {
    if (isOpen) {
      if (editingRelationship) {
        setEntity1Id(editingRelationship.sourceEntityId);
        setEntity2Id(editingRelationship.targetEntityId);
        setRelationshipType(editingRelationship.type);
        setLabel(editingRelationship.label || '');
        setFieldMappings(editingRelationship.fieldMappings || []);
        // TODO: Populate FK state from editingRelationship
      } else {
        setEntity1Id(prefilledSourceEntityId);
        setEntity2Id(undefined);
        setRelationshipType(undefined);
        setFkSourceFieldId(undefined);
        setFkTargetFieldId(undefined);
        setCardinality('many-to-one');
        setLabel('');
        setFieldMappings([]);
      }
    }
  }, [isOpen, editingRelationship, prefilledSourceEntityId]);

  // Effect to update relationship type when entities or validation change
  useEffect(() => {
    // Auto-select type if only one is valid
    if (allowedRelationshipTypes.length === 1 && validation.isValid) {
      setRelationshipType(allowedRelationshipTypes[0]);
    } else {
      // Otherwise, reset it, forcing user to choose
      setRelationshipType(undefined);
    }

    // Reset conditional fields whenever entities change
    setFkSourceFieldId(undefined);
    setFkTargetFieldId(undefined);
    setFieldMappings([]);
  }, [entity1Id, entity2Id, allowedRelationshipTypes, validation.isValid]);

  // --- Field Mapping Handlers (Only for 'transforms-to') ---
  const addFieldMapping = () =>
    setFieldMappings([...fieldMappings, { sourceFieldId: '', targetFieldId: '' }]);
  const removeFieldMapping = (index: number) =>
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  const updateFieldMapping = (
    index: number,
    field: 'sourceFieldId' | 'targetFieldId',
    value: string
  ) => {
    setFieldMappings((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // --- Save Logic ---
  const handleSave = () => {
    if (!entity1Id || !entity2Id || !relationshipType || !validation.isValid) {
      return;
    }

    if (relationshipType === 'feeds-into' || relationshipType === 'transforms-to') {
      const validFieldMappings = fieldMappings.filter((fm) => fm.sourceFieldId && fm.targetFieldId);
      const relData: Omit<Relationship, 'id'> = {
        type: relationshipType,
        sourceEntityId: entity1Id, // Direction is guaranteed by the hook
        targetEntityId: entity2Id,
        label: label.trim() || undefined,
        fieldMappings:
          relationshipType === 'transforms-to' && validFieldMappings.length > 0
            ? validFieldMappings
            : undefined,
      };
      onSaveRelationship(
        editingRelationship ? { ...relData, id: editingRelationship.id } : relData
      );
    } else if (relationshipType === 'references') {
      if (!fkSourceFieldId || !fkTargetFieldId) {
        return;
      }

      const fkReferenceData: Field['fkReference'] = {
        targetEntityId: entity2Id, // Entity 2 is the target (PK holder)
        targetFieldId: fkTargetFieldId,
        cardinality: cardinality,
        relationshipLabel: label.trim() || undefined,
      };

      // Call the update field action on Entity 1 (FK holder)
      onUpdateEntityField(entity1Id, fkSourceFieldId, {
        isFK: true,
        fkReference: fkReferenceData,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    // TODO: Implement proper deletion for 'references' type
    if (editingRelationship?.id && onDeleteRelationship) {
      onDeleteRelationship(editingRelationship.id);
      onClose();
    }
  };

  const getRelationshipTypeInfo = (type: RelationshipType) => {
    switch (type) {
      case 'feeds-into':
        return { name: 'Feeds Into', color: 'bg-secondary-500', description: 'Data Stream → DLO' };
      case 'transforms-to':
        return { name: 'Transforms To', color: 'bg-tertiary-500', description: 'DLO → DMO' };
      case 'references':
        return { name: 'References', color: 'bg-coolgray-500', description: 'DMO → DMO (FK)' };
    }
  };

  // --- Save Button Validation ---
  const canSave = useMemo(() => {
    if (!entity1Id || !entity2Id || !relationshipType || !validation.isValid) {
      return false;
    }
    if (relationshipType === 'references') {
      return !!fkSourceFieldId && !!fkTargetFieldId;
    }
    return true;
  }, [
    entity1Id,
    entity2Id,
    relationshipType,
    fkSourceFieldId,
    fkTargetFieldId,
    validation.isValid,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-coolgray-600">
            <Link2 className="h-5 w-5" />
            {editingRelationship ? 'Edit Relationship' : 'Create Relationship'}
          </DialogTitle>
          <DialogDescription>Define how entities connect and transform data</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* --- Entity Selection --- */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Entity 1 (Selectable) */}
            <div className="space-y-2">
              <Label>Relate Entity (Source) *</Label>
              <Popover open={entity1Open} onOpenChange={setEntity1Open}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    data-testid="select-entity-1"
                  >
                    {entity1 ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full`}
                          style={{ backgroundColor: getEntityCardStyle(entity1.type).borderColor }}
                        />
                        {entity1.name}
                      </div>
                    ) : (
                      'Select entity...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search entities..." />
                    <CommandList>
                      <CommandEmpty>No entities found.</CommandEmpty>
                      <CommandGroup>
                        {entities
                          .filter((e) => e.id !== entity2Id)
                          .map((e) => (
                            <CommandItem
                              key={e.id}
                              value={`${e.name} ${e.type}`}
                              onSelect={() => {
                                setEntity1Id(e.id);
                                setEntity1Open(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  entity1Id === e.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div
                                className={`h-2 w-2 rounded-full mr-2`}
                                style={{ backgroundColor: getEntityCardStyle(e.type).borderColor }}
                              />
                              <span className="flex-1">{e.name}</span>
                              <span className="text-xs text-coolgray-400">({e.type})</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="pt-8">
              <ArrowRight className="h-5 w-5 text-coolgray-400" />
            </div>

            {/* Entity 2 (Selectable) */}
            <div className="space-y-2">
              <Label>With Entity (Target) *</Label>
              <Popover open={entity2Open} onOpenChange={setEntity2Open}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    data-testid="select-entity-2"
                  >
                    {entity2 ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full`}
                          style={{ backgroundColor: getEntityCardStyle(entity2.type).borderColor }}
                        />
                        {entity2.name}
                      </div>
                    ) : (
                      'Select entity...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search entities..." />
                    <CommandList>
                      <CommandEmpty>No entities found.</CommandEmpty>
                      <CommandGroup>
                        {entities
                          .filter((e) => e.id !== entity1Id)
                          .map((e) => (
                            <CommandItem
                              key={e.id}
                              value={`${e.name} ${e.type}`}
                              onSelect={() => {
                                setEntity2Id(e.id);
                                setEntity2Open(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  entity2Id === e.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div
                                className={`h-2 w-2 rounded-full mr-2`}
                                style={{ backgroundColor: getEntityCardStyle(e.type).borderColor }}
                              />
                              <span className="flex-1">{e.name}</span>
                              <span className="text-xs text-coolgray-400">({e.type})</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* --- Validation Error Message --- */}
          {!validation.isValid && validation.message && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs font-medium">{validation.message}</p>
            </div>
          )}

          {/* --- Relationship Type (Conditional) --- */}
          {entity1 && entity2 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium text-coolgray-600">Relationship Type *</Label>
              {allowedRelationshipTypes.length > 0 ? (
                <div
                  className={`grid grid-cols-${Math.max(1, allowedRelationshipTypes.length)} gap-3`}
                >
                  {(['feeds-into', 'transforms-to', 'references'] as RelationshipType[]).map(
                    (type) => {
                      if (!allowedRelationshipTypes.includes(type)) {
                        return null;
                      } // Only render allowed types
                      const info = getRelationshipTypeInfo(type);
                      const isInvalid = !validation.isValid && validation.invalidType === type;

                      return (
                        <button
                          key={type}
                          onClick={() => !isInvalid && setRelationshipType(type)}
                          disabled={isInvalid}
                          className={cn(
                            'p-4 rounded-lg border-2 text-left transition-all',
                            relationshipType === type &&
                              'border-primary-500 bg-primary-50 ring-2 ring-primary-500/50', // Selected
                            isInvalid &&
                              'border-coolgray-100 bg-coolgray-50 text-coolgray-400 cursor-not-allowed opacity-70', // Invalid
                            !isInvalid &&
                              relationshipType !== type &&
                              'border-coolgray-200 hover:border-coolgray-300' // Valid
                          )}
                          data-testid={`button-type-${type}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={cn(
                                'h-3 w-3 rounded-full',
                                isInvalid ? 'bg-coolgray-300' : info.color
                              )}
                            />
                            <span
                              className={cn(
                                'font-semibold text-sm',
                                isInvalid ? 'text-coolgray-400' : 'text-coolgray-600'
                              )}
                            >
                              {info.name}
                            </span>
                          </div>
                          <p
                            className={cn(
                              'text-xs',
                              isInvalid ? 'text-coolgray-400' : 'text-coolgray-500'
                            )}
                          >
                            {info.description}
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-xs text-center text-coolgray-400 italic py-2">
                  No valid relationship types for this entity combination.
                </p>
              )}
            </div>
          )}

          {/* --- Optional Label --- */}
          {relationshipType && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="relationship-label">Relationship Label (optional)</Label>
              <Input
                id="relationship-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., 'sources from', 'belongs to', 'derives from'"
                data-testid="input-relationship-label"
              />
            </div>
          )}

          {/* --- Key Mappings (Conditional for 'references') --- */}
          {relationshipType === 'references' && entity1 && entity2 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium text-coolgray-600">Key Mappings *</Label>
              <div className="flex items-center gap-2">
                <Select value={fkSourceFieldId} onValueChange={setFkSourceFieldId}>
                  <SelectTrigger className="flex-1" data-testid="select-fk-source-field">
                    <SelectValue placeholder={`FK field from ${entity1.name}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {entity1.fields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ArrowRight className="h-4 w-4 text-coolgray-400 flex-shrink-0" />
                <Select value={fkTargetFieldId} onValueChange={setFkTargetFieldId}>
                  <SelectTrigger className="flex-1" data-testid="select-fk-target-field">
                    <SelectValue placeholder={`PK field from ${entity2.name}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {entity2.fields
                      .filter((f) => f.isPK)
                      .map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ({f.type})
                        </SelectItem>
                      ))}
                    {entity2.fields.filter((f) => f.isPK).length === 0 && (
                      <div className="p-2 text-xs text-coolgray-400">No PK fields found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-1/2 pr-1">
                <Label className="text-xs text-coolgray-600">Cardinality</Label>
                <Select value={cardinality} onValueChange={(v) => setCardinality(v as Cardinality)}>
                  <SelectTrigger
                    className="text-[14px] border-coolgray-200 mt-1"
                    data-testid="select-cardinality"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-to-one">One-to-One (1:1)</SelectItem>
                    <SelectItem value="one-to-many">One-to-Many (1:M)</SelectItem>
                    <SelectItem value="many-to-one">Many-to-One (M:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* --- Field Mappings (Conditional for 'transforms-to') --- */}
          {relationshipType === 'transforms-to' && entity1 && entity2 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-coolgray-600">
                  Field Mappings (optional)
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFieldMapping}
                  data-testid="button-add-field-mapping"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Mapping
                </Button>
              </div>
              {fieldMappings.length === 0 ? (
                <p className="text-xs text-coolgray-400 text-center py-4">
                  No field mappings defined. Click &quot;Add Mapping&quot; to connect specific
                  fields.
                </p>
              ) : (
                <div className="space-y-2">
                  {fieldMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={mapping.sourceFieldId}
                        onValueChange={(value) => updateFieldMapping(index, 'sourceFieldId', value)}
                      >
                        <SelectTrigger
                          className="flex-1"
                          data-testid={`select-source-field-${index}`}
                        >
                          <SelectValue placeholder={`Field from ${entity1.name}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {entity1.fields.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} ({f.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ArrowRight className="h-4 w-4 text-coolgray-400 flex-shrink-0" />
                      <Select
                        value={mapping.targetFieldId}
                        onValueChange={(value) => updateFieldMapping(index, 'targetFieldId', value)}
                      >
                        <SelectTrigger
                          className="flex-1"
                          data-testid={`select-target-field-${index}`}
                        >
                          <SelectValue placeholder={`Field from ${entity2.name}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {entity2.fields.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} ({f.type})
                            </SelectItem>
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

          {/* --- Footer Buttons --- */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {editingRelationship && onDeleteRelationship && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-500 border-red-300 hover:bg-red-50"
                  data-testid="button-delete-relationship"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
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
