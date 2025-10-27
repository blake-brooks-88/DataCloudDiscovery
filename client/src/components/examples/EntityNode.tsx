import EntityNode from '../EntityNode';
import type { Entity } from '@shared/schema';

export default function EntityNodeExample() {
  const entity: Entity = {
    id: '1',
    name: 'Customer',
    sourceSystem: {
      type: 'salesforce',
      name: 'Salesforce CRM',
    },
    dataCloudIntent: {
      objectType: 'Profile',
    },
    fields: [
      {
        id: 'f1',
        name: 'customer_id',
        type: 'uuid',
        isPK: true,
        isFK: false,
      },
      {
        id: 'f2',
        name: 'account_id',
        type: 'uuid',
        isPK: false,
        isFK: true,
        fkReference: {
          targetEntityId: '2',
          targetFieldId: 'f10',
          cardinality: 'many-to-one',
        },
      },
      {
        id: 'f3',
        name: 'email',
        type: 'email',
        isPK: false,
        isFK: false,
        containsPII: true,
      },
      {
        id: 'f4',
        name: 'first_name',
        type: 'string',
        isPK: false,
        isFK: false,
        containsPII: true,
      },
      {
        id: 'f5',
        name: 'last_name',
        type: 'string',
        isPK: false,
        isFK: false,
        containsPII: true,
        flag: 'caution',
      },
      {
        id: 'f6',
        name: 'created_at',
        type: 'datetime',
        isPK: false,
        isFK: false,
      },
    ],
  };

  return (
    <div className="relative w-full h-96 bg-coolgray-50">
      <EntityNode
        entity={entity}
        isSelected={false}
        onSelect={() => console.log('Entity selected')}
        onDragStart={(e) => console.log('Drag start', e)}
        onDrag={(e) => console.log('Dragging', e)}
        onDragEnd={(e) => console.log('Drag end', e)}
        style={{ left: 100, top: 50 }}
      />
    </div>
  );
}
