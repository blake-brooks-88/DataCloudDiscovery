import { z } from 'zod';

export type FieldType =
  | 'string'
  | 'text'
  | 'int'
  | 'float'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'json'
  | 'jsonb'
  | 'uuid'
  | 'enum'
  | 'phone'
  | 'email';

export type EntityType = 'data-source' | 'data-stream' | 'dlo' | 'dmo' | 'data-transform';

export type RelationshipType = 'feeds-into' | 'transforms-to' | 'references';

export type SourceSystemType =
  | 'salesforce'
  | 'database'
  | 'api'
  | 'csv'
  | 'erp'
  | 'marketing-cloud'
  | 'custom';

export type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-one';

export type DataCloudObjectType = 'Profile' | 'Engagement' | 'Other' | 'TBD';

export type ImplementationStatus = 'not-started' | 'in-progress' | 'completed';

export const fkReferenceSchema = z.object({
  targetEntityId: z.string(),
  targetFieldId: z.string(),
  cardinality: z.enum(['one-to-one', 'one-to-many', 'many-to-one']),
  relationshipLabel: z.string().optional(),
  waypoints: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
});

export type FKReference = z.infer<typeof fkReferenceSchema>;

export const fieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required'),
  type: z.enum([
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
  ]),
  isPK: z.boolean().default(false),
  isFK: z.boolean().default(false),
  fkReference: fkReferenceSchema.optional(),
  businessName: z.string().optional(),
  notes: z.string().optional(),
  sampleValues: z.array(z.string()).optional(),
  containsPII: z.boolean().optional(),
  visibleInERD: z.boolean().default(true),
});

export type Field = z.infer<typeof fieldSchema>;

export const streamConfigSchema = z.object({
  refreshType: z.enum(['full', 'incremental']),
  schedule: z.enum(['real-time', 'hourly', 'daily', 'weekly', 'custom']),
  customSchedule: z.string().optional(),
  dataSourceId: z.string().optional(),
  sourceObjectName: z.string(),
  connectorType: z.enum(['native', 'mulesoft', 'csv', 'ftp', 'api']).optional(),
});

export type StreamConfig = z.infer<typeof streamConfigSchema>;

export const dataCloudMetadataSchema = z.object({
  streamConfig: streamConfigSchema.optional(),
  objectType: z.enum(['DLO', 'DMO']).optional(),
  profileObjectType: z.enum(['Profile', 'Engagement', 'Other', 'TBD']).optional(),
  apiName: z.string().optional(),
  transformLogic: z.string().optional(),
});

export type DataCloudMetadata = z.infer<typeof dataCloudMetadataSchema>;

export const fieldMappingSchema = z.object({
  targetFieldId: z.string(),
  sourceEntityId: z.string(),
  sourceFieldId: z.string(),
  transformDescription: z.string().optional(),
  waypoints: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
});

export type FieldMapping = z.infer<typeof fieldMappingSchema>;

export const entitySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Entity name is required'),
  type: z.enum(['data-source', 'data-stream', 'dlo', 'dmo', 'data-transform']),
  fields: z.array(fieldSchema),
  dataSourceId: z.string().optional(),
  sourceDataStreamId: z.string().optional(),
  sourceDLOIds: z.array(z.string()).optional(),
  dataCloudMetadata: dataCloudMetadataSchema.optional(),
  fieldMappings: z.array(fieldMappingSchema).optional(),
  dataSource: z.string().optional(),
  businessPurpose: z.string().optional(),
  implementationStatus: z.enum(['not-started', 'in-progress', 'completed']).optional(),
  implementationNotes: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export type Entity = z.infer<typeof entitySchema>;

export const dataSourceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Data source name is required'),
  type: z.enum(['salesforce', 'database', 'api', 'csv', 'erp', 'marketing-cloud', 'custom']),
  description: z.string().optional(),
  connectionDetails: z.string().optional(),
  environment: z.enum(['production', 'sandbox', 'dev', 'uat']).optional(),
  contactPerson: z.string().optional(),
  collapsed: z.boolean().optional(),
});

export type DataSource = z.infer<typeof dataSourceSchema>;

export const relationshipSchema = z.object({
  id: z.string(),
  type: z.enum(['feeds-into', 'transforms-to', 'references']),
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  label: z.string().optional(),
  fieldMappings: z
    .array(
      z.object({
        sourceFieldId: z.string(),
        targetFieldId: z.string(),
      })
    )
    .optional(),
});

export type Relationship = z.infer<typeof relationshipSchema>;

export const OrganizationMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  // role: z.enum(['owner', 'admin', 'member']),
});
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  organizations: z.array(OrganizationMemberSchema),
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  // role: z.enum(['owner', 'admin', 'member']),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const ProjectSummarySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  clientName: z.string().optional(),
  consultant: z.string().optional(),
  createdAt: z.number(),
  lastModified: z.number(),
  organizationId: z.string(),
});
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

export const ProjectDetailSchema = ProjectSummarySchema.extend({
  dataSources: z.array(dataSourceSchema).default([]),
  entities: z.array(entitySchema).default([]),
  relationships: z.array(relationshipSchema).default([]),
});
export type ProjectDetail = z.infer<typeof ProjectDetailSchema>;

export const MockDbStateSchema = z.object({
  projects: z.array(ProjectDetailSchema).default([]),
});
export type MockDbState = z.infer<typeof MockDbStateSchema>;

export const insertProjectSchema = ProjectDetailSchema.omit({
  id: true,
  createdAt: true,
  lastModified: true,
  organizationId: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;

export const insertEntitySchema = entitySchema.omit({ id: true });
export type InsertEntity = z.infer<typeof insertEntitySchema>;

export const insertFieldSchema = fieldSchema.omit({ id: true });
export type InsertField = z.infer<typeof insertFieldSchema>;

export const insertDataSourceSchema = dataSourceSchema.omit({ id: true });
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

export const insertRelationshipSchema = relationshipSchema.omit({ id: true });
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
