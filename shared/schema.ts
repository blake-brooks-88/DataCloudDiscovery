import { z } from "zod";

export type FieldType = 'string' | 'text' | 'int' | 'float' | 'number' | 'decimal' | 
  'boolean' | 'date' | 'datetime' | 'timestamp' | 'json' | 'jsonb' | 
  'uuid' | 'enum' | 'phone' | 'email';

export type SourceSystemType = 'salesforce' | 'database' | 'api' | 'csv' | 
  'erp' | 'marketing_tool' | 'custom';

export type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-one';

export type DataCloudObjectType = 'Profile' | 'Engagement' | 'Other' | 'TBD';

export type ImplementationStatus = 'not-started' | 'in-progress' | 'completed';

export const fkReferenceSchema = z.object({
  targetEntityId: z.string(),
  targetFieldId: z.string(),
  cardinality: z.enum(['one-to-one', 'one-to-many', 'many-to-one']),
  relationshipLabel: z.string().optional(),
});

export type FKReference = z.infer<typeof fkReferenceSchema>;

export const fieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Field name is required"),
  type: z.enum(['string', 'text', 'int', 'float', 'number', 'decimal', 
    'boolean', 'date', 'datetime', 'timestamp', 'json', 'jsonb', 
    'uuid', 'enum', 'phone', 'email']),
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

export const sourceSystemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Source system name is required"),
  type: z.enum(['salesforce', 'database', 'api', 'csv', 'erp', 'marketing_tool', 'custom']),
  connectionDetails: z.string().optional(),
  color: z.string().optional(),
});

export type SourceSystem = z.infer<typeof sourceSystemSchema>;

export const insertSourceSystemSchema = sourceSystemSchema.omit({ id: true });
export type InsertSourceSystem = z.infer<typeof insertSourceSystemSchema>;

export const dataCloudIntentSchema = z.object({
  objectType: z.enum(['Profile', 'Engagement', 'Other', 'TBD']),
  notes: z.string().optional(),
});

export type DataCloudIntent = z.infer<typeof dataCloudIntentSchema>;

export const entitySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Entity name is required"),
  fields: z.array(fieldSchema),
  sourceSystemId: z.string(),
  businessPurpose: z.string().optional(),
  dataCloudIntent: dataCloudIntentSchema.optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  implementationStatus: z.enum(['not-started', 'in-progress', 'completed']).optional(),
  implementationNotes: z.string().optional(),
});

export type Entity = z.infer<typeof entitySchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  clientName: z.string().optional(),
  consultant: z.string().optional(),
  createdAt: z.number(),
  lastModified: z.number(),
  entities: z.array(entitySchema),
  sourceSystems: z.array(sourceSystemSchema).default([]),
});

export type Project = z.infer<typeof projectSchema>;

export const insertProjectSchema = projectSchema.omit({ id: true, createdAt: true, lastModified: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;

export const insertEntitySchema = entitySchema.omit({ id: true });
export type InsertEntity = z.infer<typeof insertEntitySchema>;

export const insertFieldSchema = fieldSchema.omit({ id: true });
export type InsertField = z.infer<typeof insertFieldSchema>;
