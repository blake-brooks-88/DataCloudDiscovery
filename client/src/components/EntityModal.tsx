import { useState } from "react";
import { X, Plus, Trash2, Key, Link as LinkIcon, AlertTriangle, AlertCircle, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Entity, Field, SourceSystemType, FieldType, DataCloudObjectType, Cardinality } from "@shared/schema";

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
  entities: Entity[];
  onSave: (entity: Partial<Entity>) => void;
}

export default function EntityModal({ isOpen, onClose, entity, entities, onSave }: EntityModalProps) {
  const [name, setName] = useState(entity?.name || "");
  const [sourceType, setSourceType] = useState<SourceSystemType>(entity?.sourceSystem.type || "database");
  const [sourceName, setSourceName] = useState(entity?.sourceSystem.name || "");
  const [businessPurpose, setBusinessPurpose] = useState(entity?.businessPurpose || "");
  const [dataCloudType, setDataCloudType] = useState<DataCloudObjectType>(entity?.dataCloudIntent?.objectType || "TBD");
  const [fields, setFields] = useState<Field[]>(entity?.fields || []);

  const handleAddField = () => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: "",
      type: "string",
      isPK: false,
      isFK: false,
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
      sourceSystem: { type: sourceType, name: sourceName },
      businessPurpose,
      dataCloudIntent: { objectType: dataCloudType },
      fields,
      ...(entity?.position && { position: entity.position }),
    };
    onSave(updatedEntity);
    onClose();
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
              <Label htmlFor="source-type" className="text-sm font-medium text-coolgray-500">
                Source System Type *
              </Label>
              <Select value={sourceType} onValueChange={(value) => setSourceType(value as SourceSystemType)}>
                <SelectTrigger className="mt-1 border-coolgray-200" data-testid="select-source-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-coolgray-200">
                  <SelectItem value="salesforce">Salesforce</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="erp">ERP</SelectItem>
                  <SelectItem value="marketing_tool">Marketing Tool</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source-name" className="text-sm font-medium text-coolgray-500">
                Source System Name
              </Label>
              <Input
                id="source-name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g., PostgreSQL, Salesforce CRM"
                className="mt-1 border-coolgray-200 focus:border-secondary-500"
                data-testid="input-source-name"
              />
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
          />
          <Textarea
            value={field.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Description"
            className="text-sm border-coolgray-200"
            rows={2}
          />
          <div className="flex gap-2">
            <Select
              value={field.flag || 'none'}
              onValueChange={(value) => onUpdate({ flag: value === 'none' ? null : value as 'caution' | 'critical' })}
            >
              <SelectTrigger className="text-sm border-coolgray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-coolgray-200">
                <SelectItem value="none">No Flag</SelectItem>
                <SelectItem value="caution">Caution</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
