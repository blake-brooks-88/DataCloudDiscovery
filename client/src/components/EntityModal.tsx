import { useState, useEffect } from "react";
import { X, Plus, Trash2, Key, Link as LinkIcon, Lock, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Entity, Field, SourceSystem, FieldType, DataCloudObjectType, Cardinality } from "@shared/schema";

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
  entities: Entity[];
  sourceSystems: SourceSystem[];
  onSave: (entity: Partial<Entity>) => void;
  onCreateSourceSystem: () => void;
}

export default function EntityModal({ isOpen, onClose, entity, entities, sourceSystems, onSave, onCreateSourceSystem }: EntityModalProps) {
  const [name, setName] = useState("");
  const [sourceSystemId, setSourceSystemId] = useState("");
  const [businessPurpose, setBusinessPurpose] = useState("");
  const [dataCloudType, setDataCloudType] = useState<DataCloudObjectType>("TBD");
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    if (entity) {
      setName(entity.name || "");
      setSourceSystemId(entity.sourceSystemId || "");
      setBusinessPurpose(entity.businessPurpose || "");
      setDataCloudType(entity.dataCloudIntent?.objectType || "TBD");
      setFields(entity.fields || []);
    } else {
      setName("");
      setSourceSystemId(sourceSystems[0]?.id || "");
      setBusinessPurpose("");
      setDataCloudType("TBD");
      setFields([]);
    }
  }, [entity, isOpen, sourceSystems]);

  const handleAddField = () => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: "",
      type: "string",
      isPK: false,
      isFK: false,
      visibleInERD: true,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleFieldChange = (fieldId: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleSave = () => {
    const updatedEntity: Partial<Entity> = {
      ...(entity?.id && { id: entity.id }),
      name,
      sourceSystemId,
      businessPurpose,
      dataCloudIntent: { objectType: dataCloudType },
      fields,
      ...(entity?.position && { position: entity.position }),
    };
    onSave(updatedEntity);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white border-coolgray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-coolgray-600">
            {entity ? 'Edit Entity' : 'Create New Entity'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entity-name" className="text-sm font-medium text-coolgray-500">
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
              <Label htmlFor="source-system" className="text-sm font-medium text-coolgray-500">
                Source System *
              </Label>
              <div className="flex gap-2 mt-1">
                <Select value={sourceSystemId} onValueChange={setSourceSystemId}>
                  <SelectTrigger className="border-coolgray-200" data-testid="select-source-system">
                    <SelectValue placeholder="Select source system" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-coolgray-200">
                    {sourceSystems.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} ({source.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCreateSourceSystem}
                  className="border-primary-500 text-primary-500 hover:bg-primary-50"
                  data-testid="button-create-source-system"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="data-cloud-type" className="text-sm font-medium text-coolgray-500">
                Data Cloud Object Type
              </Label>
              <Select value={dataCloudType} onValueChange={(value) => setDataCloudType(value as DataCloudObjectType)}>
                <SelectTrigger className="mt-1 border-coolgray-200" data-testid="select-data-cloud-type">
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
          </div>

          <div>
            <Label htmlFor="business-purpose" className="text-sm font-medium text-coolgray-500">
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

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-coolgray-600">Fields</Label>
              <Button
                onClick={handleAddField}
                size="sm"
                className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                data-testid="button-add-field"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  entities={entities}
                  currentEntityId={entity?.id}
                  onUpdate={(updates) => handleFieldChange(field.id, updates)}
                  onRemove={() => handleRemoveField(field.id)}
                />
              ))}
              {fields.length === 0 && (
                <div className="text-center py-8 text-coolgray-400 text-sm">
                  No fields yet. Click "Add Field" to create one.
                </div>
              )}
            </div>
          </div>
        </div>

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
            disabled={!name || !sourceSystemId || fields.length === 0}
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

interface FieldRowProps {
  field: Field;
  entities: Entity[];
  currentEntityId?: string;
  onUpdate: (updates: Partial<Field>) => void;
  onRemove: () => void;
}

function FieldRow({ field, entities, currentEntityId, onUpdate, onRemove }: FieldRowProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const availableEntities = entities.filter(e => e.id !== currentEntityId);

  return (
    <div className="border border-coolgray-200 rounded-lg p-3 space-y-3 bg-coolgray-50">
      <div className="grid grid-cols-12 gap-2 items-start">
        <div className="col-span-3">
          <Input
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Field name"
            className="text-sm border-coolgray-200 font-mono"
            data-testid={`input-field-name-${field.id}`}
          />
        </div>

        <div className="col-span-2">
          <Select value={field.type} onValueChange={(value) => onUpdate({ type: value as FieldType })}>
            <SelectTrigger className="text-sm border-coolgray-200" data-testid={`select-field-type-${field.id}`}>
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

        <div className="col-span-6 flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-coolgray-600">
            <Checkbox
              checked={field.isPK}
              onCheckedChange={(checked) => onUpdate({ isPK: checked as boolean })}
              data-testid={`checkbox-pk-${field.id}`}
            />
            <Key className="h-3 w-3 text-primary-500" />
            PK
          </label>
          <label className="flex items-center gap-1 text-xs text-coolgray-600">
            <Checkbox
              checked={field.isFK}
              onCheckedChange={(checked) => onUpdate({ isFK: checked as boolean })}
              data-testid={`checkbox-fk-${field.id}`}
            />
            <LinkIcon className="h-3 w-3 text-secondary-500" />
            FK
          </label>
          <label className="flex items-center gap-1 text-xs text-coolgray-600">
            <Checkbox
              checked={field.containsPII}
              onCheckedChange={(checked) => onUpdate({ containsPII: checked as boolean })}
              data-testid={`checkbox-pii-${field.id}`}
            />
            <Lock className="h-3 w-3 text-warning-500" />
            PII
          </label>
          <label className="flex items-center gap-1 text-xs text-coolgray-600">
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
            className="text-xs text-secondary-500 hover:text-secondary-600"
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

      {showAdvanced && (
        <div className="space-y-2 pt-2 border-t border-coolgray-200">
          <Input
            value={field.businessName || ""}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            placeholder="Business name"
            className="text-sm border-coolgray-200"
            data-testid={`input-business-name-${field.id}`}
          />
          <Textarea
            value={field.notes || ""}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Notes"
            className="text-sm border-coolgray-200"
            rows={2}
            data-testid={`textarea-notes-${field.id}`}
          />
        </div>
      )}
    </div>
  );
}
