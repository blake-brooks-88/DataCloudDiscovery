import { useState } from 'react';
import GraphView from '../GraphView';
import type { Entity } from '@shared/schema';

export default function GraphViewExample() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [entities, setEntities] = useState<Entity[]>([
    {
      id: '1',
      name: 'Customer',
      sourceSystem: { type: 'salesforce', name: 'Salesforce CRM' },
      dataCloudIntent: { objectType: 'Profile' },
      position: { x: 100, y: 100 },
      fields: [
        { id: 'f1', name: 'customer_id', type: 'uuid', isPK: true, isFK: false },
        { id: 'f2', name: 'email', type: 'email', isPK: false, isFK: false, containsPII: true },
        { id: 'f3', name: 'first_name', type: 'string', isPK: false, isFK: false },
      ],
    },
    {
      id: '2',
      name: 'Order',
      sourceSystem: { type: 'database', name: 'PostgreSQL' },
      dataCloudIntent: { objectType: 'Engagement' },
      position: { x: 450, y: 100 },
      fields: [
        { id: 'f4', name: 'order_id', type: 'uuid', isPK: true, isFK: false },
        {
          id: 'f5',
          name: 'customer_id',
          type: 'uuid',
          isPK: false,
          isFK: true,
          fkReference: {
            targetEntityId: '1',
            targetFieldId: 'f1',
            cardinality: 'many-to-one',
          },
        },
        { id: 'f6', name: 'total_amount', type: 'decimal', isPK: false, isFK: false },
      ],
    },
    {
      id: '3',
      name: 'Product',
      sourceSystem: { type: 'api', name: 'Product API' },
      dataCloudIntent: { objectType: 'Other' },
      position: { x: 250, y: 350 },
      fields: [
        { id: 'f7', name: 'product_id', type: 'uuid', isPK: true, isFK: false },
        { id: 'f8', name: 'name', type: 'string', isPK: false, isFK: false },
        { id: 'f9', name: 'price', type: 'decimal', isPK: false, isFK: false },
      ],
    },
  ]);

  const handleUpdatePosition = (entityId: string, position: { x: number; y: number }) => {
    setEntities(entities.map(e => e.id === entityId ? { ...e, position } : e));
  };

  return (
    <div className="h-[600px] border border-coolgray-200 rounded-xl overflow-hidden">
      <GraphView
        entities={entities}
        selectedEntityId={selectedEntityId}
        onSelectEntity={setSelectedEntityId}
        onUpdateEntityPosition={handleUpdatePosition}
        onEntityDoubleClick={(id) => console.log('Double click entity:', id)}
      />
    </div>
  );
}
