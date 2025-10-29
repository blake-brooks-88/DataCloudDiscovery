import type { InsertEntity, InsertRelationship } from '@shared/schema';

/**
 * Generates a large test dataset of entities and relationships
 * for performance testing and profiling.
 */

/**
 * Generates a specified number of test entities with realistic field structures.
 *
 * @param {number} count - Number of entities to generate
 * @returns {{ entities: InsertEntity[], relationships: InsertRelationship[] }}
 */
export function generateTestDataset(count: number): {
  entities: InsertEntity[];
  relationships: InsertRelationship[];
} {
  const entities: InsertEntity[] = [];
  const relationships: InsertRelationship[] = [];

  const ENTITY_SPACING = 400;
  const COLUMNS = 6;

  // Generate Data Streams (20% of total)
  const streamCount = Math.floor(count * 0.2);
  for (let i = 0; i < streamCount; i++) {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);

    entities.push({
      name: `Stream_${i + 1}`,
      type: 'data-stream',
      dataSource: `Source_${(i % 3) + 1}`,
      position: {
        x: 100 + col * ENTITY_SPACING,
        y: 100 + row * ENTITY_SPACING,
      },
      fields: [
        {
          id: `stream_${i}_field_1`,
          name: 'id',
          type: 'uuid',
          isPK: true,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
        {
          id: `stream_${i}_field_2`,
          name: 'customer_email',
          type: 'email',
          isPK: false,
          isFK: false,
          containsPII: true,
          visibleInERD: true,
        },
        {
          id: `stream_${i}_field_3`,
          name: 'transaction_amount',
          type: 'decimal',
          isPK: false,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
        {
          id: `stream_${i}_field_4`,
          name: 'created_at',
          type: 'timestamp',
          isPK: false,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
      ],
      dataCloudMetadata: {
        streamConfig: {
          refreshType: i % 2 === 0 ? 'full' : 'incremental',
          schedule: i % 3 === 0 ? 'hourly' : 'daily',
          sourceObjectName: `Object_${i + 1}`,
          connectorType: 'native',
        },
      },
    });
  }

  // Generate DLOs (40% of total)
  const dloCount = Math.floor(count * 0.4);
  // const dloStartIndex = streamCount;
  for (let i = 0; i < dloCount; i++) {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS) + Math.ceil(streamCount / COLUMNS);

    const entityId = `dlo_${i}`;
    entities.push({
      name: `DLO_${i + 1}`,
      type: 'dlo',
      dataSource: `DLO_Source_${(i % 3) + 1}`,
      position: {
        x: 100 + col * ENTITY_SPACING,
        y: 100 + row * ENTITY_SPACING,
      },
      sourceDataStreamId: i < streamCount ? `stream_${i}` : undefined,
      fields: [
        {
          id: `${entityId}_field_1`,
          name: 'dlo_id',
          type: 'uuid',
          isPK: true,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
        {
          id: `${entityId}_field_2`,
          name: 'email_address',
          type: 'email',
          isPK: false,
          isFK: false,
          containsPII: true,
          visibleInERD: true,
        },
        {
          id: `${entityId}_field_3`,
          name: 'amount',
          type: 'decimal',
          isPK: false,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
        {
          id: `${entityId}_field_4`,
          name: 'timestamp',
          type: 'timestamp',
          isPK: false,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
        {
          id: `${entityId}_field_5`,
          name: 'status',
          type: 'string',
          isPK: false,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
      ],
    });

    // Create feeds-into relationships
    if (i < streamCount) {
      relationships.push({
        type: 'feeds-into',
        sourceEntityId: `stream_${i}`,
        targetEntityId: entityId,
        label: 'Ingests',
      });
    }
  }

  // Generate DMOs (40% of total)
  const dmoCount = count - streamCount - dloCount;
  for (let i = 0; i < dmoCount; i++) {
    const col = i % COLUMNS;
    const row =
      Math.floor(i / COLUMNS) + Math.ceil(streamCount / COLUMNS) + Math.ceil(dloCount / COLUMNS);

    const entityId = `dmo_${i}`;
    entities.push({
      name: `DMO_${i + 1}`,
      type: 'dmo',
      dataSource: `DMO_Source_${(i % 3) + 1}`,
      position: {
        x: 100 + col * ENTITY_SPACING,
        y: 100 + row * ENTITY_SPACING,
      },
      sourceDLOIds: i < dloCount ? [`dlo_${i}`] : undefined,
      fields: [
        {
          id: `${entityId}_field_1`,
          name: 'dmo_id',
          type: 'uuid',
          isPK: true,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
        {
          id: `${entityId}_field_2`,
          name: 'unified_email',
          type: 'email',
          isPK: false,
          isFK: false,
          containsPII: true,
          visibleInERD: true,
        },
        {
          id: `${entityId}_field_3`,
          name: 'total_value',
          type: 'decimal',
          isPK: false,
          isFK: false,
          containsPII: false,
          visibleInERD: true,
        },
        {
          id: `${entityId}_field_4`,
          name: 'customer_id',
          type: 'uuid',
          isPK: false,
          isFK: true,
          containsPII: false,
          visibleInERD: true,
          fkReference:
            i > 0
              ? {
                  targetEntityId: `dmo_${i - 1}`,
                  targetFieldId: `dmo_${i - 1}_field_1`,
                  cardinality: 'many-to-one',
                  relationshipLabel: 'belongs_to',
                }
              : undefined,
        },
      ],
      dataCloudMetadata: {
        profileObjectType: i % 2 === 0 ? 'Profile' : 'Engagement',
      },
    });

    // Create transforms-to relationships
    if (i < dloCount) {
      relationships.push({
        type: 'transforms-to',
        sourceEntityId: `dlo_${i}`,
        targetEntityId: entityId,
        fieldMappings: [
          {
            sourceFieldId: `dlo_${i}_field_2`,
            targetFieldId: `${entityId}_field_2`,
          },
          {
            sourceFieldId: `dlo_${i}_field_3`,
            targetFieldId: `${entityId}_field_3`,
          },
        ],
      });
    }
  }

  return { entities, relationships };
}

/**
 * Example usage in a component or test:
 *
 * ```typescript
 * import { generateTestDataset } from '@/lib/test-data-generator';
 *
 * // Generate 50 entities for stress testing
 * const { entities, relationships } = generateTestDataset(50);
 *
 * // Bulk import into your project
 * entities.forEach(entity => createEntity(projectId, entity));
 * relationships.forEach(rel => createRelationship(projectId, rel));
 * ```
 */
