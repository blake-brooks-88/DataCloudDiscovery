import { useState } from 'react';
import { Check, ChevronsUpDown, ArrowRight, X } from 'lucide-react';
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
import type { Entity, FieldMapping } from '@shared/schema';
import { cn } from '@/lib/utils';
import { getEntityCardStyle } from '@/styles/dataCloudStyles';

interface FieldSourcePickerProps {
  // Trigger element for the popover
  children: React.ReactNode;
  // All entities (for source selection)
  entities: Entity[];
  // The DMO entity being edited (target of the mapping)
  targetEntityId: string;
  // The specific DMO field being mapped
  targetFieldId: string;
  // Callback to add the new mapping
  onAddMapping: (mapping: FieldMapping) => void;
  // Function to close the popover (optional, can use internal state too)
  onClose?: () => void;
  // Allow passing className for positioning/styling the trigger
  className?: string;
}

export function FieldSourcePicker({
  children,
  entities,
  targetEntityId,
  targetFieldId,
  onAddMapping,
  onClose,
  className,
}: FieldSourcePickerProps) {
  const [sourceEntityId, setSourceEntityId] = useState<string | undefined>();
  const [sourceFieldId, setSourceFieldId] = useState<string | undefined>();
  const [isEntityPickerOpen, setIsEntityPickerOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // Control popover visibility

  // Filter potential source entities (DLOs and DMOs, excluding the target itself)
  const potentialSources = entities.filter(
    (e) => (e.type === 'dlo' || e.type === 'dmo') && e.id !== targetEntityId
  );

  const selectedSourceEntity = entities.find((e) => e.id === sourceEntityId);

  const handleAddClick = () => {
    if (!sourceEntityId || !sourceFieldId) {
      return;
    }

    const newMapping: FieldMapping = {
      sourceEntityId,
      sourceFieldId,
      targetFieldId,
      // transformDescription could be added here later
    };
    onAddMapping(newMapping);
    // Reset state and close
    setSourceEntityId(undefined);
    setSourceFieldId(undefined);
    setIsPopoverOpen(false); // Close popover
    onClose?.(); // Call external close handler if provided
  };

  // Function to handle opening/closing and resetting state
  const handleOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (!open) {
      // Reset state when closing
      setSourceEntityId(undefined);
      setSourceFieldId(undefined);
      setIsEntityPickerOpen(false); // Ensure combobox closes too
      onClose?.();
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild className={className}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" side="bottom" align="start">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-coolgray-600">Select Field Source</Label>
            <Button
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="h-6 w-6 p-0 text-coolgray-400 hover:text-coolgray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Source Entity Picker */}
          <div className="space-y-1">
            <Label className="text-xs text-coolgray-500">Source Entity</Label>
            <Popover open={isEntityPickerOpen} onOpenChange={setIsEntityPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isEntityPickerOpen}
                  className="w-full justify-between h-8 text-xs"
                >
                  {selectedSourceEntity ? (
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full`}
                        style={{
                          backgroundColor: getEntityCardStyle(selectedSourceEntity.type)
                            .borderColor,
                        }}
                      />
                      {selectedSourceEntity.name} ({selectedSourceEntity.type})
                    </div>
                  ) : (
                    'Select entity...'
                  )}
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0">
                <Command>
                  <CommandInput placeholder="Search entities..." className="h-8 text-xs" />
                  <CommandList>
                    <CommandEmpty>No entities found.</CommandEmpty>
                    <CommandGroup>
                      {potentialSources.map((entity) => (
                        <CommandItem
                          key={entity.id}
                          value={`${entity.name} ${entity.type}`}
                          onSelect={() => {
                            setSourceEntityId(entity.id);
                            setSourceFieldId(undefined); // Reset field when entity changes
                            setIsEntityPickerOpen(false);
                          }}
                          className="text-xs"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-3 w-3',
                              sourceEntityId === entity.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div
                            className={`h-2 w-2 rounded-full mr-2`}
                            style={{ backgroundColor: getEntityCardStyle(entity.type).borderColor }}
                          />
                          <span className="flex-1">{entity.name}</span>
                          <span className="text-xs text-coolgray-400 ml-2">({entity.type})</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Source Field Picker */}
          <div className="space-y-1">
            <Label className="text-xs text-coolgray-500">Source Field</Label>
            <Select
              value={sourceFieldId}
              onValueChange={setSourceFieldId}
              disabled={!selectedSourceEntity} // Disable until source entity is chosen
            >
              <SelectTrigger className="w-full h-8 text-xs" disabled={!selectedSourceEntity}>
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {selectedSourceEntity?.fields.map((field) => (
                  <SelectItem key={field.id} value={field.id} className="text-xs">
                    {field.name} ({field.type})
                  </SelectItem>
                ))}
                {selectedSourceEntity && selectedSourceEntity.fields.length === 0 && (
                  <div className="px-2 py-1 text-xs text-coolgray-400">No fields found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Add Mapping Button */}
          <Button
            size="sm"
            onClick={handleAddClick}
            disabled={!sourceEntityId || !sourceFieldId} // Enable only when both selections are made
            className="w-full bg-primary-500 hover:bg-primary-600 text-white"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Map Field Source
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
