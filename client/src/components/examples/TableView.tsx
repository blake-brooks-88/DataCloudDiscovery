import TableView from '../TableView';
import type { Entity } from '@shared/schema';

export default function TableViewExample() {
  const entities: Entity[] = [
    {
      id: '1',
      name: 'Customer',
      sourceSystem: { type: 'salesforce', name: 'Salesforce CRM' },
      dataCloudIntent: { objectType: 'Profile' },
      fields: [
        {
          id: 'f1',
          name: 'customer_id',
          type: 'uuid',
          isPK: true,
          isFK: false,
          businessName: 'Customer Identifier',
          description: 'Unique identifier for each customer',
        },
        {
          id: 'f2',
          name: 'email',
          type: 'email',
          isPK: false,
          isFK: false,
          containsPII: true,
          businessName: 'Email Address',
          description: 'Customer email for communications',
          flag: 'caution',
        },
        {
          id: 'f3',
          name: 'first_name',
          type: 'string',
          isPK: false,
          isFK: false,
          containsPII: true,
          businessName: 'First Name',
        },
      ],
    },
    {
      id: '2',
      name: 'Order',
      sourceSystem: { type: 'database', name: 'PostgreSQL' },
      dataCloudIntent: { objectType: 'Engagement' },
      fields: [
        {
          id: 'f4',
          name: 'order_id',
          type: 'uuid',
          isPK: true,
          isFK: false,
          businessName: 'Order ID',
        },
        {
          id: 'f5',
          name: 'customer_id',
          type: 'uuid',
          isPK: false,
          isFK: true,
          businessName: 'Customer Reference',
        },
        {
          id: 'f6',
          name: 'total_amount',
          type: 'decimal',
          isPK: false,
          isFK: false,
          businessName: 'Total Amount',
          flag: 'critical',
        },
      ],
    },
  ];

  return (
    <div className="h-[600px] border border-coolgray-200 rounded-xl overflow-hidden">
      <TableView
        entities={entities}
        onEntityClick={(id) => console.log('Entity clicked:', id)}
      />
    </div>
  );
}
