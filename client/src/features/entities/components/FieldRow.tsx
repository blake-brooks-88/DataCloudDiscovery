import { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Key,
  Link as LinkIcon,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
import type { Entity, Field, FieldMapping, FieldType, Relationship } from '@shared/schema';
// Import the new picker component
import { FieldSourcePicker } from './FieldSourcePicker'; // Assuming it's in the same directory

/**
 * Props for the FieldRow sub-component.
 */
interface FieldRowProps {
  field: Field;
  entity: Entity | null; // Parent entity (DMO) being edited
  entities: Entity[]; // All entities in the project (for picker and display)
  relationships: Relationship[]; // All relationships in the project (for upgrade check)
  entityFieldMappings: FieldMapping[]; // Current mappings specifically for the parent entity
  onUpdate: (updates: Partial<Field>) => void; // Update this field's basic props
  onRemove: () => void; // Remove this field
  onUpdateFieldMappings: (entityId: string, fieldMappings: FieldMapping[]) => void; // Update the parent entity's mappings array
  onDeleteRelationship?: (relationshipId: string) => void; // Callback to delete a top-level relationship
}

/**
 * A sub-component for rendering a single field row within the EntityModal.
 */
export function FieldRow({
  field,
  entity, // The DMO being edited
  entities, // Needed for picker and displaying FKs
  relationships, // Needed ONLY for upgrade check in handleAddMapping
  entityFieldMappings, // The DMO's current fieldMappings array
  onUpdate,
  onRemove,
  onUpdateFieldMappings,
  onDeleteRelationship, // Get the delete function
}: FieldRowProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const fieldSources = useMemo(() => {
    // This correctly shows mappings IF they exist on the entity object
    return entityFieldMappings.filter((fm) => fm.targetFieldId === field.id);
  }, [entityFieldMappings, field.id]);

  /**
   * This function is now the callback for the FieldSourcePicker.
   * It handles the "Upgrade Path" logic BEFORE the new mapping is added.
   */
  const handleAddMapping = (newMapping: FieldMapping) => {
    if (!entity || entity.type !== 'dmo' || !onDeleteRelationship) {
      return;
    }

    // --- UPGRADE PATH LOGIC ---
    const shorthandRelationship = relationships.find(
      (r) => r.type === 'transforms-to' && r.targetEntityId === entity.id
    );

    let finalMappings = entityFieldMappings;

    if (shorthandRelationship) {
      const sourceDlo = entities.find((e) => e.id === shorthandRelationship.sourceEntityId);
      if (!sourceDlo) {
        // Decide how to handle this error - maybe prevent adding new source?
        // For now, we proceed but the backfill will be empty.
      } else {
        // Generate the 1:1 backfilled mappings
        const backfilledMappings: FieldMapping[] = entity.fields
          .map((targetField) => {
            const sourceField = sourceDlo.fields.find((f) => f.name === targetField.name);
            if (sourceField) {
              return {
                targetFieldId: targetField.id,
                sourceEntityId: sourceDlo.id,
                sourceFieldId: sourceField.id,
              };
            }
            return null; // Return null for fields without a match
          })
          .filter((mapping): mapping is FieldMapping => mapping !== null); // Filter out nulls

        finalMappings = backfilledMappings;
      }
      // Delete the old shorthand relationship AFTER calculating backfill
      onDeleteRelationship(shorthandRelationship.id);

      // Update state immediately with backfilled mappings + the new one
      onUpdateFieldMappings(entity.id, [...finalMappings, newMapping]);
    } else {
      // No upgrade needed, just add the new mapping
      onUpdateFieldMappings(entity.id, [...entityFieldMappings, newMapping]);
    }
  };

  const handleRemoveSource = (sourceEntityId: string, sourceFieldId: string) => {
    if (!entity) {
      return;
    }
    const updatedMappings = entityFieldMappings.filter(
      (fm) =>
        !(
          fm.targetFieldId === field.id &&
          fm.sourceEntityId === sourceEntityId &&
          fm.sourceFieldId === sourceFieldId
        )
    );
    // This correctly calls the update function passed from home.tsx
    onUpdateFieldMappings(entity.id, updatedMappings);
  };

  return (
    <div className="border border-coolgray-200 rounded-xl p-3 space-y-3 bg-coolgray-50">
      {/* --- Top Row: Name, Type, Flags --- */}
      <div className="grid grid-cols-12 gap-2 items-start">
        {/* Name Input */}
        <div className="col-span-3">
          <Input
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Field name"
            className="text-xs border-coolgray-200 font-mono"
          />
        </div>
        {/* Type Select */}
        <div className="col-span-2">
          <Select
            value={field.type}
            onValueChange={(value) => onUpdate({ type: value as FieldType })}
          >
            <SelectTrigger className="text-xs border-coolgray-200">
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
            </SelectContent>
          </Select>
        </div>
        {/* Flags */}
        <div className="col-span-6 flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-coolgray-600">
            {' '}
            <Checkbox checked={field.isPK} onCheckedChange={(c) => onUpdate({ isPK: !!c })} />{' '}
            <Key className="h-3 w-3 text-primary-500" /> PK{' '}
          </label>
          <label className="flex items-center gap-1 text-[10px] text-coolgray-600">
            {' '}
            <LinkIcon className="h-3 w-3 text-secondary-500" /> FK{' '}
            {field.isFK && field.fkReference && (
              <span className="ml-1 text-[10px] text-coolgray-400 italic">
                (references{' '}
                {entities.find((e) => e.id === field.fkReference?.targetEntityId)?.name || '...'})
              </span>
            )}{' '}
          </label>
          <label className="flex items-center gap-1 text-[10px] text-coolgray-600">
            {' '}
            <Checkbox
              checked={!!field.containsPII}
              onCheckedChange={(c) => onUpdate({ containsPII: !!c })}
            />{' '}
            <Lock className="h-3 w-3 text-warning-500" /> PII{' '}
          </label>
          <label className="flex items-center gap-1 text-[10px] text-coolgray-600">
            {' '}
            <Checkbox
              checked={field.visibleInERD !== false}
              onCheckedChange={(c) => onUpdate({ visibleInERD: !!c })}
            />{' '}
            {field.visibleInERD !== false ? (
              <Eye className="h-3 w-3 text-secondary-500" />
            ) : (
              <EyeOff className="h-3 w-3 text-coolgray-400" />
            )}{' '}
            ERD{' '}
          </label>
          {entity?.type === 'dmo' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSources(!showSources)}
              className="text-[10px] h-6 px-1 text-secondary-500 hover:text-secondary-600"
            >
              Sources{' '}
              {showSources ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] h-6 px-1 text-secondary-500 hover:text-secondary-600"
          >
            {showAdvanced ? 'Less' : 'More'}
          </Button>
        </div>
        {/* Remove Button */}
        <div className="col-span-1 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-danger-500 hover:bg-danger-50"
          >
            {' '}
            <Trash2 className="h-4 w-4" />{' '}
          </Button>
        </div>
      </div>

      {/* --- Field Source(s) Section --- */}
      {entity?.type === 'dmo' && showSources && (
        <div className="space-y-2 pt-3 border-t border-coolgray-200/60 mt-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium text-coolgray-600">Field Source(s)</Label>
            {/* Wrap Button in Picker */}
            <FieldSourcePicker
              entities={entities}
              targetEntityId={entity.id}
              targetFieldId={field.id}
              onAddMapping={handleAddMapping} // Pass the handler
            >
              {/* The Button is now the trigger */}
              <Button variant="outline" className="bg-white">
                <Plus className="h-3 w-3 mr-1" /> Add Source
              </Button>
            </FieldSourcePicker>
          </div>
          {/* Display existing sources */}
          {fieldSources.length === 0 ? (
            <p className="text-xs text-coolgray-400 italic text-center py-2">
              No sources mapped to this field yet.
            </p>
          ) : (
            <div className="space-y-1">
              {fieldSources.map((mapping, index) => {
                const sourceEntity = entities.find((e) => e.id === mapping.sourceEntityId);
                const sourceField = sourceEntity?.fields.find(
                  (f) => f.id === mapping.sourceFieldId
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs p-1.5 bg-coolgray-100 rounded"
                  >
                    <span>
                      Mapped from:{' '}
                      <span className="font-medium">{sourceEntity?.name || 'Unknown'}</span>.
                      <span className="font-mono text-coolgray-500">
                        {sourceField?.name || 'unknown'}
                      </span>
                      {mapping.transformDescription && (
                        <span className="text-coolgray-400 italic ml-1">
                          ({mapping.transformDescription})
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      className="h-5 w-5 p-0 text-coolgray-400 hover:text-danger-500"
                      onClick={() =>
                        handleRemoveSource(mapping.sourceEntityId, mapping.sourceFieldId)
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Advanced Section --- */}
      {showAdvanced && (
        <div className="space-y-2 pt-2 border-t border-coolgray-200 mt-2">
          <Input
            value={field.businessName || ''}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            placeholder="Business name"
            className="text-[14px] border-coolgray-200"
          />
          <Textarea
            value={field.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Notes"
            className="text-[14px] border-coolgray-200"
            rows={2}
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
                onUpdate({ sampleValues: values.length > 0 ? values : undefined });
              }}
              placeholder="e.g., value1 | value2 | value3"
              className="text-[14px] border-coolgray-200 mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
