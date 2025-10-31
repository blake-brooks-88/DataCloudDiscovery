import { describe, it, expect } from 'vitest';
import {
  ProjectSummarySchema,
  ProjectDetailSchema,
  entitySchema,
  relationshipSchema,
  fieldSchema,
  dataSourceSchema,
  fkReferenceSchema,
  streamConfigSchema,
  fieldMappingSchema,
} from '../schema';

describe('ProjectSummarySchema', () => {
  it('should parse a valid project with all required fields', () => {
    const validProject = {
      id: 'proj_123',
      name: 'Test Project',
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org_123',
    };

    const result = ProjectSummarySchema.safeParse(validProject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validProject);
    }
  });

  it('should parse a valid project with optional fields', () => {
    const validProject = {
      id: 'proj_123',
      name: 'Test Project',
      clientName: 'Acme Corp',
      consultant: 'John Doe',
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org_123',
    };

    const result = ProjectSummarySchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('should fail when name is missing', () => {
    const invalidProject = {
      id: 'proj_123',
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org_123',
    };

    const result = ProjectSummarySchema.safeParse(invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('name');
    }
  });

  it('should fail when name is an empty string', () => {
    const invalidProject = {
      id: 'proj_123',
      name: '',
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org_123',
    };

    const result = ProjectSummarySchema.safeParse(invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Project name is required');
    }
  });

  it('should parse project with optional fields as undefined', () => {
    const project = {
      id: 'proj_123',
      name: 'Test Project',
      clientName: undefined,
      consultant: undefined,
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org_123',
    };

    const result = ProjectSummarySchema.safeParse(project);
    expect(result.success).toBe(true);
  });
});

describe('ProjectDetailSchema', () => {
  it('should parse a complete project with entities and relationships', () => {
    const validProject = {
      id: 'proj_123',
      name: 'Test Project',
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org_123',
      dataSources: [],
      entities: [
        {
          id: 'ent_1',
          name: 'Test Entity',
          type: 'dlo' as const,
          fields: [],
        },
      ],
      relationships: [],
    };

    const result = ProjectDetailSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('should default arrays to empty if not provided', () => {
    const project = {
      id: 'proj_123',
      name: 'Test Project',
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org_123',
    };

    const result = ProjectDetailSchema.safeParse(project);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dataSources).toEqual([]);
      expect(result.data.entities).toEqual([]);
      expect(result.data.relationships).toEqual([]);
    }
  });
});

describe('entitySchema', () => {
  it('should parse a valid data-stream entity', () => {
    const validEntity = {
      id: 'ent_1',
      name: 'Customer Stream',
      type: 'data-stream' as const,
      fields: [],
    };

    const result = entitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('should parse a valid dlo entity', () => {
    const validEntity = {
      id: 'ent_2',
      name: 'Customer DLO',
      type: 'dlo' as const,
      fields: [],
    };

    const result = entitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('should parse a valid dmo entity', () => {
    const validEntity = {
      id: 'ent_3',
      name: 'Customer DMO',
      type: 'dmo' as const,
      fields: [],
    };

    const result = entitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('should parse a valid data-source entity', () => {
    const validEntity = {
      id: 'ent_4',
      name: 'Salesforce Data Source',
      type: 'data-source' as const,
      fields: [],
    };

    const result = entitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('should parse a valid data-transform entity', () => {
    const validEntity = {
      id: 'ent_5',
      name: 'Customer Transform',
      type: 'data-transform' as const,
      fields: [],
    };

    const result = entitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('should fail when entity type is invalid', () => {
    const invalidEntity = {
      id: 'ent_1',
      name: 'Invalid Entity',
      type: 'invalid-type',
      fields: [],
    };

    const result = entitySchema.safeParse(invalidEntity);
    expect(result.success).toBe(false);
  });

  it('should fail when entity name is missing', () => {
    const invalidEntity = {
      id: 'ent_1',
      type: 'dlo',
      fields: [],
    };

    const result = entitySchema.safeParse(invalidEntity);
    expect(result.success).toBe(false);
  });

  it('should fail when entity name is empty string', () => {
    const invalidEntity = {
      id: 'ent_1',
      name: '',
      type: 'dlo',
      fields: [],
    };

    const result = entitySchema.safeParse(invalidEntity);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Entity name is required');
    }
  });

  it('should parse entity with all optional fields populated', () => {
    const entityWithAllFields = {
      id: 'ent_1',
      name: 'Complete Entity',
      type: 'dlo' as const,
      fields: [],
      dataSourceId: 'ds_1',
      sourceDataStreamId: 'stream_1',
      sourceDLOIds: ['dlo_1', 'dlo_2'],
      dataCloudMetadata: {
        objectType: 'DLO' as const,
        apiName: 'Customer__dloc',
      },
      fieldMappings: [],
      dataSource: 'Salesforce',
      businessPurpose: 'Customer data management',
      implementationStatus: 'in-progress' as const,
      implementationNotes: 'Work in progress',
      position: { x: 100, y: 200 },
    };

    const result = entitySchema.safeParse(entityWithAllFields);
    expect(result.success).toBe(true);
  });

  it('should parse entity with position coordinates', () => {
    const entity = {
      id: 'ent_1',
      name: 'Test Entity',
      type: 'dlo' as const,
      fields: [],
      position: { x: 250, y: 350 },
    };

    const result = entitySchema.safeParse(entity);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toEqual({ x: 250, y: 350 });
    }
  });
});

describe('relationshipSchema', () => {
  it('should parse a valid feeds-into relationship', () => {
    const validRelationship = {
      id: 'rel_1',
      type: 'feeds-into' as const,
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
    };

    const result = relationshipSchema.safeParse(validRelationship);
    expect(result.success).toBe(true);
  });

  it('should parse a valid transforms-to relationship', () => {
    const validRelationship = {
      id: 'rel_2',
      type: 'transforms-to' as const,
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
    };

    const result = relationshipSchema.safeParse(validRelationship);
    expect(result.success).toBe(true);
  });

  it('should parse a valid references relationship', () => {
    const validRelationship = {
      id: 'rel_3',
      type: 'references' as const,
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
    };

    const result = relationshipSchema.safeParse(validRelationship);
    expect(result.success).toBe(true);
  });

  it('should fail when relationship type is invalid', () => {
    const invalidRelationship = {
      id: 'rel_1',
      type: 'invalid-type',
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
    };

    const result = relationshipSchema.safeParse(invalidRelationship);
    expect(result.success).toBe(false);
  });

  it('should fail when sourceEntityId is missing', () => {
    const invalidRelationship = {
      id: 'rel_1',
      type: 'feeds-into',
      targetEntityId: 'ent_2',
    };

    const result = relationshipSchema.safeParse(invalidRelationship);
    expect(result.success).toBe(false);
  });

  it('should fail when targetEntityId is missing', () => {
    const invalidRelationship = {
      id: 'rel_1',
      type: 'feeds-into',
      sourceEntityId: 'ent_1',
    };

    const result = relationshipSchema.safeParse(invalidRelationship);
    expect(result.success).toBe(false);
  });

  it('should parse relationship with optional label and field mappings', () => {
    const relationship = {
      id: 'rel_1',
      type: 'feeds-into' as const,
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
      label: 'Customer Data Flow',
      fieldMappings: [
        { sourceFieldId: 'field_1', targetFieldId: 'field_2' },
        { sourceFieldId: 'field_3', targetFieldId: 'field_4' },
      ],
    };

    const result = relationshipSchema.safeParse(relationship);
    expect(result.success).toBe(true);
  });
});

describe('fieldSchema', () => {
  it('should parse a valid field with all required properties', () => {
    const validField = {
      id: 'field_1',
      name: 'customer_id',
      type: 'string' as const,
    };

    const result = fieldSchema.safeParse(validField);
    expect(result.success).toBe(true);
  });

  it('should default isPK to false', () => {
    const field = {
      id: 'field_1',
      name: 'customer_id',
      type: 'string' as const,
    };

    const result = fieldSchema.safeParse(field);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPK).toBe(false);
    }
  });

  it('should default isFK to false', () => {
    const field = {
      id: 'field_1',
      name: 'customer_id',
      type: 'string' as const,
    };

    const result = fieldSchema.safeParse(field);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFK).toBe(false);
    }
  });

  it('should default visibleInERD to true', () => {
    const field = {
      id: 'field_1',
      name: 'customer_id',
      type: 'string' as const,
    };

    const result = fieldSchema.safeParse(field);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibleInERD).toBe(true);
    }
  });

  it('should parse field with isPK set to true', () => {
    const field = {
      id: 'field_1',
      name: 'id',
      type: 'uuid' as const,
      isPK: true,
    };

    const result = fieldSchema.safeParse(field);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPK).toBe(true);
    }
  });

  it('should parse field with FK reference', () => {
    const field = {
      id: 'field_1',
      name: 'account_id',
      type: 'uuid' as const,
      isFK: true,
      fkReference: {
        targetEntityId: 'ent_2',
        targetFieldId: 'field_id',
        cardinality: 'many-to-one' as const,
      },
    };

    const result = fieldSchema.safeParse(field);
    expect(result.success).toBe(true);
  });

  it('should fail when field name is missing', () => {
    const invalidField = {
      id: 'field_1',
      type: 'string',
    };

    const result = fieldSchema.safeParse(invalidField);
    expect(result.success).toBe(false);
  });

  it('should fail when field name is empty string', () => {
    const invalidField = {
      id: 'field_1',
      name: '',
      type: 'string',
    };

    const result = fieldSchema.safeParse(invalidField);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Field name is required');
    }
  });

  it('should parse all valid field types', () => {
    const fieldTypes = [
      'string',
      'text',
      'int',
      'float',
      'number',
      'decimal',
      'boolean',
      'date',
      'datetime',
      'timestamp',
      'json',
      'jsonb',
      'uuid',
      'enum',
      'phone',
      'email',
    ] as const;

    fieldTypes.forEach((type) => {
      const field = {
        id: `field_${type}`,
        name: `test_${type}`,
        type,
      };

      const result = fieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });
  });

  it('should fail for invalid field type', () => {
    const invalidField = {
      id: 'field_1',
      name: 'test_field',
      type: 'invalid_type',
    };

    const result = fieldSchema.safeParse(invalidField);
    expect(result.success).toBe(false);
  });

  it('should parse field with all optional fields populated', () => {
    const field = {
      id: 'field_1',
      name: 'customer_email',
      type: 'email' as const,
      businessName: 'Customer Email Address',
      notes: 'Primary contact email',
      sampleValues: ['test@example.com', 'user@domain.com'],
      containsPII: true,
      visibleInERD: false,
    };

    const result = fieldSchema.safeParse(field);
    expect(result.success).toBe(true);
  });
});

describe('dataSourceSchema', () => {
  it('should parse a valid data source with required fields', () => {
    const validDataSource = {
      id: 'ds_1',
      name: 'Salesforce Production',
      type: 'salesforce' as const,
    };

    const result = dataSourceSchema.safeParse(validDataSource);
    expect(result.success).toBe(true);
  });

  it('should parse all valid data source types', () => {
    const types = [
      'salesforce',
      'database',
      'api',
      'csv',
      'erp',
      'marketing-cloud',
      'custom',
    ] as const;

    types.forEach((type) => {
      const dataSource = {
        id: `ds_${type}`,
        name: `${type} source`,
        type,
      };

      const result = dataSourceSchema.safeParse(dataSource);
      expect(result.success).toBe(true);
    });
  });

  it('should fail when data source name is missing', () => {
    const invalidDataSource = {
      id: 'ds_1',
      type: 'salesforce',
    };

    const result = dataSourceSchema.safeParse(invalidDataSource);
    expect(result.success).toBe(false);
  });

  it('should fail when data source name is empty string', () => {
    const invalidDataSource = {
      id: 'ds_1',
      name: '',
      type: 'salesforce',
    };

    const result = dataSourceSchema.safeParse(invalidDataSource);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Data source name is required');
    }
  });

  it('should parse data source with all optional fields', () => {
    const dataSource = {
      id: 'ds_1',
      name: 'Salesforce Production',
      type: 'salesforce' as const,
      description: 'Production Salesforce instance',
      connectionDetails: 'https://instance.salesforce.com',
      environment: 'production' as const,
      contactPerson: 'John Doe',
      collapsed: false,
    };

    const result = dataSourceSchema.safeParse(dataSource);
    expect(result.success).toBe(true);
  });
});

describe('fkReferenceSchema', () => {
  it('should parse a valid FK reference', () => {
    const validFKRef = {
      targetEntityId: 'ent_2',
      targetFieldId: 'field_id',
      cardinality: 'many-to-one' as const,
    };

    const result = fkReferenceSchema.safeParse(validFKRef);
    expect(result.success).toBe(true);
  });

  it('should parse FK reference with optional fields', () => {
    const fkRef = {
      targetEntityId: 'ent_2',
      targetFieldId: 'field_id',
      cardinality: 'one-to-many' as const,
      relationshipLabel: 'Customer Accounts',
      waypoints: [
        { x: 100, y: 200 },
        { x: 150, y: 250 },
      ],
    };

    const result = fkReferenceSchema.safeParse(fkRef);
    expect(result.success).toBe(true);
  });

  it('should parse all valid cardinality types', () => {
    const cardinalities = ['one-to-one', 'one-to-many', 'many-to-one'] as const;

    cardinalities.forEach((cardinality) => {
      const fkRef = {
        targetEntityId: 'ent_2',
        targetFieldId: 'field_id',
        cardinality,
      };

      const result = fkReferenceSchema.safeParse(fkRef);
      expect(result.success).toBe(true);
    });
  });
});

describe('streamConfigSchema', () => {
  it('should parse a valid stream config', () => {
    const validStreamConfig = {
      refreshType: 'incremental' as const,
      schedule: 'daily' as const,
      sourceObjectName: 'Account',
    };

    const result = streamConfigSchema.safeParse(validStreamConfig);
    expect(result.success).toBe(true);
  });

  it('should parse stream config with all optional fields', () => {
    const streamConfig = {
      refreshType: 'full' as const,
      schedule: 'custom' as const,
      customSchedule: '0 0 * * *',
      dataSourceId: 'ds_1',
      sourceObjectName: 'Contact',
      connectorType: 'mulesoft' as const,
    };

    const result = streamConfigSchema.safeParse(streamConfig);
    expect(result.success).toBe(true);
  });

  it('should fail when sourceObjectName is missing', () => {
    const invalidStreamConfig = {
      refreshType: 'incremental',
      schedule: 'daily',
    };

    const result = streamConfigSchema.safeParse(invalidStreamConfig);
    expect(result.success).toBe(false);
  });
});

describe('fieldMappingSchema', () => {
  it('should parse a valid field mapping', () => {
    const validMapping = {
      targetFieldId: 'field_target',
      sourceEntityId: 'ent_source',
      sourceFieldId: 'field_source',
    };

    const result = fieldMappingSchema.safeParse(validMapping);
    expect(result.success).toBe(true);
  });

  it('should parse field mapping with optional fields', () => {
    const mapping = {
      targetFieldId: 'field_target',
      sourceEntityId: 'ent_source',
      sourceFieldId: 'field_source',
      transformDescription: 'UPPERCASE(source_field)',
      waypoints: [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ],
    };

    const result = fieldMappingSchema.safeParse(mapping);
    expect(result.success).toBe(true);
  });
});
