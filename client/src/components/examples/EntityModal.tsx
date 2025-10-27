import { useState } from 'react';
import EntityModal from '../EntityModal';
import { Button } from '@/components/ui/button';
import type { Entity } from '@shared/schema';

export default function EntityModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const entities: Entity[] = [
    {
      id: '1',
      name: 'Account',
      sourceSystem: { type: 'salesforce', name: 'Salesforce CRM' },
      fields: [
        { id: 'f1', name: 'account_id', type: 'uuid', isPK: true, isFK: false },
      ],
    },
  ];

  return (
    <div className="p-8">
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-primary-500 hover:bg-primary-600 text-white"
      >
        Open Entity Modal
      </Button>
      <EntityModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        entity={null}
        entities={entities}
        onSave={(entity) => {
          console.log('Save entity:', entity);
          setIsOpen(false);
        }}
      />
    </div>
  );
}
