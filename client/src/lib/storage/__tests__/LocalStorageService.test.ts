import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageService } from '../LocalStorageService';
import type {
  InsertProject,
  InsertEntity,
  InsertRelationship,
  InsertDataSource,
} from '@shared/schema';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    service = new LocalStorageService();
    // Spy on console.error to verify error handling
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // ============================================================
  // Project CRUD Operations
  // ============================================================

  describe('Project Operations', () => {
    describe('getAllProjects', () => {
      it('should return empty array when no projects exist', async () => {
        const projects = await service.getAllProjects();

        expect(projects).toEqual([]);
      });

      it('should return all projects as summaries', async () => {
        // Create two projects
        const project1: InsertProject = {
          name: 'Project 1',
          clientName: 'Client A',
        };
        const project2: InsertProject = {
          name: 'Project 2',
        };

        await service.createProject(project1);
        await service.createProject(project2);

        const projects = await service.getAllProjects();

        expect(projects).toHaveLength(2);
        expect(projects[0]).toHaveProperty('id');
        expect(projects[0]).toHaveProperty('name', 'Project 1');
        expect(projects[0]).toHaveProperty('clientName', 'Client A');
        expect(projects[0]).toHaveProperty('createdAt');
        expect(projects[0]).toHaveProperty('lastModified');
        expect(projects[1]).toHaveProperty('name', 'Project 2');
      });
    });

    describe('getProject', () => {
      it('should return null when project does not exist', async () => {
        const project = await service.getProject('non-existent-id');

        expect(project).toBeNull();
      });

      it('should return full project details when project exists', async () => {
        const insertProject: InsertProject = {
          name: 'Test Project',
          clientName: 'Test Client',
          consultant: 'John Doe',
        };

        const created = await service.createProject(insertProject);
        const retrieved = await service.getProject(created.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe('Test Project');
        expect(retrieved?.clientName).toBe('Test Client');
        expect(retrieved?.consultant).toBe('John Doe');
        expect(retrieved?.entities).toEqual([]);
        expect(retrieved?.relationships).toEqual([]);
        expect(retrieved?.dataSources).toEqual([]);
      });
    });

    describe('createProject', () => {
      it('should create project with all fields', async () => {
        const insertProject: InsertProject = {
          name: 'New Project',
          clientName: 'Acme Corp',
          consultant: 'Jane Smith',
        };

        const project = await service.createProject(insertProject);

        expect(project.id).toBeDefined();
        expect(project.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(project.name).toBe('New Project');
        expect(project.clientName).toBe('Acme Corp');
        expect(project.consultant).toBe('Jane Smith');
        expect(project.createdAt).toBeDefined();
        expect(project.lastModified).toBeDefined();
        expect(project.organizationId).toBe('org_personal_mock');
        expect(project.entities).toEqual([]);
        expect(project.relationships).toEqual([]);
        expect(project.dataSources).toEqual([]);
      });

      it('should create project with minimal data (name only)', async () => {
        const insertProject: InsertProject = {
          name: 'Minimal Project',
        };

        const project = await service.createProject(insertProject);

        expect(project.id).toBeDefined();
        expect(project.name).toBe('Minimal Project');
        expect(project.description).toBeUndefined();
      });

      it('should persist project to localStorage', async () => {
        const insertProject: InsertProject = {
          name: 'Persisted Project',
        };

        await service.createProject(insertProject);

        // Create new service instance to verify persistence
        const newService = new LocalStorageService();
        const projects = await newService.getAllProjects();

        expect(projects).toHaveLength(1);
        expect(projects[0]?.name).toBe('Persisted Project');
      });
    });

    describe('updateProject', () => {
      it('should update project name', async () => {
        const created = await service.createProject({ name: 'Original Name' });

        // Wait 5ms to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 5));

        const updated = await service.updateProject(created.id, {
          name: 'Updated Name',
        });

        expect(updated.name).toBe('Updated Name');
        expect(updated.lastModified).toBeGreaterThan(created.lastModified);
      });

      it('should update project clientName', async () => {
        const created = await service.createProject({ name: 'Test' });

        const updated = await service.updateProject(created.id, {
          clientName: 'New Client',
        });

        expect(updated.clientName).toBe('New Client');
      });

      it('should throw error when project not found', async () => {
        await expect(service.updateProject('non-existent', { name: 'New Name' })).rejects.toThrow(
          'Project with id non-existent not found'
        );
      });

      it('should persist updates to localStorage', async () => {
        const created = await service.createProject({ name: 'Original' });
        await service.updateProject(created.id, { name: 'Updated' });

        const newService = new LocalStorageService();
        const retrieved = await newService.getProject(created.id);

        expect(retrieved?.name).toBe('Updated');
      });
    });

    describe('deleteProject', () => {
      it('should delete existing project', async () => {
        const created = await service.createProject({ name: 'To Delete' });

        await service.deleteProject(created.id);

        const retrieved = await service.getProject(created.id);
        expect(retrieved).toBeNull();
      });

      it('should throw error when project not found', async () => {
        await expect(service.deleteProject('non-existent')).rejects.toThrow(
          'Project with id non-existent not found'
        );
      });

      it('should persist deletion to localStorage', async () => {
        const created = await service.createProject({ name: 'To Delete' });
        await service.deleteProject(created.id);

        const newService = new LocalStorageService();
        const projects = await newService.getAllProjects();

        expect(projects).toHaveLength(0);
      });
    });
  });

  // ============================================================
  // Entity CRUD Operations
  // ============================================================

  describe('Entity Operations', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await service.createProject({ name: 'Test Project' });
      projectId = project.id;
    });

    describe('createEntity', () => {
      it('should create entity with all fields', async () => {
        const insertEntity: InsertEntity = {
          name: 'Customer',
          type: 'dmo',
          businessPurpose: 'Customer Data Model',
          implementationNotes: 'Contains customer information',
          implementationStatus: 'in-progress',
          fields: [
            {
              id: crypto.randomUUID(),
              name: 'customerId',
              type: 'string',
              isPK: true,
              isFK: false,
              visibleInERD: true,
            },
          ],
          position: { x: 100, y: 200 },
        };

        const entity = await service.createEntity(projectId, insertEntity);

        expect(entity.id).toBeDefined();
        expect(entity.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(entity.name).toBe('Customer');
        expect(entity.type).toBe('dmo');
        expect(entity.businessPurpose).toBe('Customer Data Model');
        expect(entity.implementationNotes).toBe('Contains customer information');
        expect(entity.implementationStatus).toBe('in-progress');
        expect(entity.fields).toHaveLength(1);
        expect(entity.fields[0]?.name).toBe('customerId');
        expect(entity.position).toEqual({ x: 100, y: 200 });
      });

      it('should persist entity position with float precision (CRITICAL)', async () => {
        const insertEntity: InsertEntity = {
          name: 'Entity',
          type: 'dlo',
          fields: [],
          position: { x: 450.5, y: 789.25 },
        };

        const entity = await service.createEntity(projectId, insertEntity);

        // Verify in memory
        expect(entity.position).toEqual({ x: 450.5, y: 789.25 });

        // Verify after reload from localStorage
        const newService = new LocalStorageService();
        const project = await newService.getProject(projectId);
        const persistedEntity = project?.entities.find((e) => e.id === entity.id);

        expect(persistedEntity?.position).toEqual({ x: 450.5, y: 789.25 });
      });

      it('should create entity with minimal data', async () => {
        const insertEntity: InsertEntity = {
          name: 'Simple Entity',
          type: 'data-stream',
          fields: [],
        };

        const entity = await service.createEntity(projectId, insertEntity);

        expect(entity.id).toBeDefined();
        expect(entity.name).toBe('Simple Entity');
        expect(entity.type).toBe('data-stream');
        expect(entity.businessPurpose).toBeUndefined();
        expect(entity.fields).toEqual([]);
      });

      it('should throw error when project not found', async () => {
        const insertEntity: InsertEntity = {
          name: 'Entity',
          type: 'dlo',
          fields: [],
        };

        await expect(service.createEntity('non-existent', insertEntity)).rejects.toThrow(
          'Project with id non-existent not found'
        );
      });

      it('should update project lastModified timestamp', async () => {
        const projectBefore = await service.getProject(projectId);
        const insertEntity: InsertEntity = { name: 'Entity', type: 'dlo', fields: [] };

        // Wait 10ms to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));
        await service.createEntity(projectId, insertEntity);

        const projectAfter = await service.getProject(projectId);

        expect(projectAfter?.lastModified).toBeGreaterThan(projectBefore?.lastModified ?? 0);
      });
    });

    describe('updateEntity', () => {
      it('should update entity name', async () => {
        const created = await service.createEntity(projectId, {
          name: 'Original',
          type: 'dlo',
          fields: [],
        });

        const updated = await service.updateEntity(projectId, created.id, {
          name: 'Updated',
        });

        expect(updated.name).toBe('Updated');
        expect(updated.type).toBe('dlo');
      });

      it('should update entity position (CRITICAL)', async () => {
        const created = await service.createEntity(projectId, {
          name: 'Movable',
          type: 'dmo',
          fields: [],
          position: { x: 0, y: 0 },
        });

        const updated = await service.updateEntity(projectId, created.id, {
          position: { x: 300.75, y: 450.25 },
        });

        expect(updated.position).toEqual({ x: 300.75, y: 450.25 });

        // Verify persistence
        const project = await service.getProject(projectId);
        const persistedEntity = project?.entities.find((e) => e.id === created.id);
        expect(persistedEntity?.position).toEqual({ x: 300.75, y: 450.25 });
      });

      it('should update all entity fields', async () => {
        const created = await service.createEntity(projectId, {
          name: 'Entity',
          type: 'dlo',
          fields: [],
        });

        const updated = await service.updateEntity(projectId, created.id, {
          businessPurpose: 'Business Entity Purpose',
          implementationNotes: 'Updated implementation notes',
          implementationStatus: 'completed',
          fields: [
            {
              id: crypto.randomUUID(),
              name: 'field1',
              type: 'string',
              isPK: false,
              isFK: false,
              visibleInERD: true,
            },
          ],
        });

        expect(updated.businessPurpose).toBe('Business Entity Purpose');
        expect(updated.implementationNotes).toBe('Updated implementation notes');
        expect(updated.implementationStatus).toBe('completed');
        expect(updated.fields).toHaveLength(1);
        expect(updated.fields[0]?.name).toBe('field1');
      });

      it('should throw error when project not found', async () => {
        await expect(
          service.updateEntity('non-existent', 'entity-id', { name: 'New' })
        ).rejects.toThrow('Project with id non-existent not found');
      });

      it('should throw error when entity not found', async () => {
        await expect(
          service.updateEntity(projectId, 'non-existent', { name: 'New' })
        ).rejects.toThrow('Entity with id non-existent not found');
      });
    });

    describe('deleteEntity', () => {
      it('should delete existing entity', async () => {
        const created = await service.createEntity(projectId, {
          name: 'To Delete',
          type: 'dlo',
          fields: [],
        });

        await service.deleteEntity(projectId, created.id);

        const project = await service.getProject(projectId);
        expect(project?.entities).toHaveLength(0);
      });

      it('should cascade delete relationships when entity is deleted (CRITICAL)', async () => {
        // Create two entities
        const entity1 = await service.createEntity(projectId, {
          name: 'Entity 1',
          type: 'data-stream',
          fields: [],
        });
        const entity2 = await service.createEntity(projectId, {
          name: 'Entity 2',
          type: 'dlo',
          fields: [],
        });

        // Create relationship between them
        const _relationship = await service.createRelationship(projectId, {
          sourceEntityId: entity1.id,
          targetEntityId: entity2.id,
          type: 'feeds-into',
        });

        // Delete entity1
        await service.deleteEntity(projectId, entity1.id);

        // Verify relationship was also deleted
        const project = await service.getProject(projectId);
        expect(project?.relationships).toHaveLength(0);
        expect(project?.entities).toHaveLength(1);
        expect(project?.entities[0]?.id).toBe(entity2.id);
      });

      it('should throw error when project not found', async () => {
        await expect(service.deleteEntity('non-existent', 'entity-id')).rejects.toThrow(
          'Project with id non-existent not found'
        );
      });

      it('should throw error when entity not found', async () => {
        await expect(service.deleteEntity(projectId, 'non-existent')).rejects.toThrow(
          'Entity with id non-existent not found'
        );
      });
    });
  });

  // ============================================================
  // Relationship CRUD Operations
  // ============================================================

  describe('Relationship Operations', () => {
    let projectId: string;
    let sourceEntityId: string;
    let targetEntityId: string;

    beforeEach(async () => {
      const project = await service.createProject({ name: 'Test Project' });
      projectId = project.id;

      const source = await service.createEntity(projectId, {
        name: 'Source',
        type: 'data-stream',
        fields: [],
      });
      const target = await service.createEntity(projectId, {
        name: 'Target',
        type: 'dlo',
        fields: [],
      });

      sourceEntityId = source.id;
      targetEntityId = target.id;
    });

    describe('createRelationship', () => {
      it('should create relationship with all fields', async () => {
        const insertRelationship: InsertRelationship = {
          sourceEntityId,
          targetEntityId,
          type: 'feeds-into',
          label: 'Feeds data to',
          fieldMappings: [
            {
              sourceFieldId: 'field-1',
              targetFieldId: 'field-2',
            },
          ],
        };

        const relationship = await service.createRelationship(projectId, insertRelationship);

        expect(relationship.id).toBeDefined();
        expect(relationship.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(relationship.sourceEntityId).toBe(sourceEntityId);
        expect(relationship.targetEntityId).toBe(targetEntityId);
        expect(relationship.type).toBe('feeds-into');
        expect(relationship.label).toBe('Feeds data to');
        expect(relationship.fieldMappings).toHaveLength(1);
      });

      it('should create relationship with minimal data', async () => {
        const insertRelationship: InsertRelationship = {
          sourceEntityId,
          targetEntityId,
          type: 'transforms-to',
        };

        const relationship = await service.createRelationship(projectId, insertRelationship);

        expect(relationship.id).toBeDefined();
        expect(relationship.type).toBe('transforms-to');
        expect(relationship.label).toBeUndefined();
        expect(relationship.fieldMappings).toBeUndefined();
      });

      it('should throw error when project not found', async () => {
        const insertRelationship: InsertRelationship = {
          sourceEntityId,
          targetEntityId,
          type: 'feeds-into',
        };

        await expect(
          service.createRelationship('non-existent', insertRelationship)
        ).rejects.toThrow('Project with id non-existent not found');
      });
    });

    describe('updateRelationship', () => {
      it('should update relationship label', async () => {
        const created = await service.createRelationship(projectId, {
          sourceEntityId,
          targetEntityId,
          type: 'feeds-into',
        });

        const updated = await service.updateRelationship(projectId, created.id, {
          label: 'New label',
        });

        expect(updated.label).toBe('New label');
      });

      it('should update relationship field mappings', async () => {
        const created = await service.createRelationship(projectId, {
          sourceEntityId,
          targetEntityId,
          type: 'feeds-into',
        });

        const updated = await service.updateRelationship(projectId, created.id, {
          fieldMappings: [{ sourceFieldId: 'f1', targetFieldId: 'f2' }],
        });

        expect(updated.fieldMappings).toHaveLength(1);
        expect(updated.fieldMappings?.[0]?.sourceFieldId).toBe('f1');
      });

      it('should throw error when project not found', async () => {
        await expect(
          service.updateRelationship('non-existent', 'rel-id', { label: 'New' })
        ).rejects.toThrow('Project with id non-existent not found');
      });

      it('should throw error when relationship not found', async () => {
        await expect(
          service.updateRelationship(projectId, 'non-existent', { label: 'New' })
        ).rejects.toThrow('Relationship with id non-existent not found');
      });
    });

    describe('deleteRelationship', () => {
      it('should delete existing relationship', async () => {
        const created = await service.createRelationship(projectId, {
          sourceEntityId,
          targetEntityId,
          type: 'feeds-into',
        });

        await service.deleteRelationship(projectId, created.id);

        const project = await service.getProject(projectId);
        expect(project?.relationships).toHaveLength(0);
      });

      it('should throw error when project not found', async () => {
        await expect(service.deleteRelationship('non-existent', 'rel-id')).rejects.toThrow(
          'Project with id non-existent not found'
        );
      });

      it('should throw error when relationship not found', async () => {
        await expect(service.deleteRelationship(projectId, 'non-existent')).rejects.toThrow(
          'Relationship with id non-existent not found'
        );
      });
    });
  });

  // ============================================================
  // DataSource CRUD Operations
  // ============================================================

  describe('DataSource Operations', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await service.createProject({ name: 'Test Project' });
      projectId = project.id;
    });

    describe('createDataSource', () => {
      it('should create data source with all fields', async () => {
        const insertDataSource: InsertDataSource = {
          name: 'Customer API',
          type: 'api',
          description: 'Customer data API',
          connectionDetails: 'https://api.example.com/customers',
          environment: 'production',
          contactPerson: 'John Doe',
        };

        const dataSource = await service.createDataSource(projectId, insertDataSource);

        expect(dataSource.id).toBeDefined();
        expect(dataSource.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(dataSource.name).toBe('Customer API');
        expect(dataSource.type).toBe('api');
        expect(dataSource.description).toBe('Customer data API');
        expect(dataSource.connectionDetails).toBe('https://api.example.com/customers');
        expect(dataSource.environment).toBe('production');
        expect(dataSource.contactPerson).toBe('John Doe');
      });

      it('should create data source with minimal data', async () => {
        const insertDataSource: InsertDataSource = {
          name: 'Simple Source',
          type: 'csv',
        };

        const dataSource = await service.createDataSource(projectId, insertDataSource);

        expect(dataSource.id).toBeDefined();
        expect(dataSource.name).toBe('Simple Source');
        expect(dataSource.type).toBe('csv');
        expect(dataSource.description).toBeUndefined();
        expect(dataSource.connectionDetails).toBeUndefined();
      });

      it('should throw error when project not found', async () => {
        const insertDataSource: InsertDataSource = {
          name: 'Source',
          type: 'api',
        };

        await expect(service.createDataSource('non-existent', insertDataSource)).rejects.toThrow(
          'Project with id non-existent not found'
        );
      });
    });

    describe('updateDataSource', () => {
      it('should update data source name', async () => {
        const created = await service.createDataSource(projectId, {
          name: 'Original',
          type: 'api',
        });

        const updated = await service.updateDataSource(projectId, created.id, {
          name: 'Updated',
        });

        expect(updated.name).toBe('Updated');
      });

      it('should update data source connection details', async () => {
        const created = await service.createDataSource(projectId, {
          name: 'API Source',
          type: 'api',
        });

        const updated = await service.updateDataSource(projectId, created.id, {
          connectionDetails: 'https://new-api.com',
          environment: 'sandbox',
        });

        expect(updated.connectionDetails).toBe('https://new-api.com');
        expect(updated.environment).toBe('sandbox');
      });

      it('should throw error when project not found', async () => {
        await expect(
          service.updateDataSource('non-existent', 'ds-id', { name: 'New' })
        ).rejects.toThrow('Project with id non-existent not found');
      });

      it('should throw error when data source not found', async () => {
        await expect(
          service.updateDataSource(projectId, 'non-existent', { name: 'New' })
        ).rejects.toThrow('DataSource with id non-existent not found');
      });
    });

    describe('deleteDataSource', () => {
      it('should delete existing data source', async () => {
        const created = await service.createDataSource(projectId, {
          name: 'To Delete',
          type: 'csv',
        });

        await service.deleteDataSource(projectId, created.id);

        const project = await service.getProject(projectId);
        expect(project?.dataSources).toHaveLength(0);
      });

      it('should throw error when project not found', async () => {
        await expect(service.deleteDataSource('non-existent', 'ds-id')).rejects.toThrow(
          'Project with id non-existent not found'
        );
      });

      it('should throw error when data source not found', async () => {
        await expect(service.deleteDataSource(projectId, 'non-existent')).rejects.toThrow(
          'DataSource with id non-existent not found'
        );
      });
    });
  });

  // ============================================================
  // Error Handling and Edge Cases
  // ============================================================

  describe('Error Handling', () => {
    it('should handle corrupted JSON in localStorage', async () => {
      // Manually set invalid JSON
      localStorage.setItem('data-cloud-projects', '{invalid json}');

      const service = new LocalStorageService();
      const projects = await service.getAllProjects();

      expect(projects).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load projects from localStorage:',
        expect.any(Error)
      );
      // Should clear the corrupted data
      expect(localStorage.getItem('data-cloud-projects')).toBeNull();
    });

    it('should handle empty localStorage gracefully', async () => {
      localStorage.clear();

      const service = new LocalStorageService();
      const projects = await service.getAllProjects();

      expect(projects).toEqual([]);
    });

    it('should validate data with Zod schema on save', async () => {
      const project = await service.createProject({ name: 'Test' });

      // Valid data should save successfully
      await expect(service.updateProject(project.id, { name: 'Valid' })).resolves.toBeDefined();
    });
  });

  // ============================================================
  // Data Persistence Integration Tests (CRITICAL)
  // ============================================================

  describe('Data Persistence (CRITICAL)', () => {
    it('should persist complete project data across service instances', async () => {
      // Create project with entities, relationships, and data sources
      const project = await service.createProject({
        name: 'Complete Project',
        clientName: 'Acme Corp',
        consultant: 'John Doe',
      });

      const entity1 = await service.createEntity(project.id, {
        name: 'Source Entity',
        type: 'data-stream',
        position: { x: 100, y: 200 },
        fields: [
          {
            id: crypto.randomUUID(),
            name: 'id',
            type: 'string',
            isPK: true,
            isFK: false,
            visibleInERD: true,
          },
        ],
      });

      const entity2 = await service.createEntity(project.id, {
        name: 'Target Entity',
        type: 'dlo',
        position: { x: 300, y: 400 },
        fields: [],
      });

      const _relationship = await service.createRelationship(project.id, {
        sourceEntityId: entity1.id,
        targetEntityId: entity2.id,
        type: 'feeds-into',
        label: 'Feeds into',
      });

      const _dataSource = await service.createDataSource(project.id, {
        name: 'API Source',
        type: 'api',
        description: 'External API',
        connectionDetails: 'https://api.example.com',
        environment: 'production',
      });

      // Create new service instance (simulates page reload)
      const newService = new LocalStorageService();
      const retrievedProject = await newService.getProject(project.id);

      // Verify all data persisted correctly
      expect(retrievedProject).not.toBeNull();
      expect(retrievedProject?.name).toBe('Complete Project');
      expect(retrievedProject?.clientName).toBe('Acme Corp');
      expect(retrievedProject?.consultant).toBe('John Doe');

      expect(retrievedProject?.entities).toHaveLength(2);
      expect(retrievedProject?.entities[0]?.name).toBe('Source Entity');
      expect(retrievedProject?.entities[0]?.position).toEqual({ x: 100, y: 200 });
      expect(retrievedProject?.entities[0]?.fields).toHaveLength(1);
      expect(retrievedProject?.entities[1]?.fields).toEqual([]);
      expect(retrievedProject?.entities[1]?.name).toBe('Target Entity');

      expect(retrievedProject?.relationships).toHaveLength(1);
      expect(retrievedProject?.relationships?.[0]?.label).toBe('Feeds into');

      expect(retrievedProject?.dataSources).toHaveLength(1);
      expect(retrievedProject?.dataSources?.[0]?.name).toBe('API Source');
      expect(retrievedProject?.dataSources?.[0]?.description).toBe('External API');
      expect(retrievedProject?.dataSources?.[0]?.connectionDetails).toBe('https://api.example.com');
      expect(retrievedProject?.dataSources?.[0]?.environment).toBe('production');
    });

    it('should preserve all entity fields across updates (CRITICAL)', async () => {
      const project = await service.createProject({ name: 'Test' });

      // Create entity with all possible fields
      const entity = await service.createEntity(project.id, {
        name: 'Complex Entity',
        type: 'dmo',
        businessPurpose: 'Complex Business Entity',
        implementationNotes: 'Entity with all fields',
        implementationStatus: 'in-progress',
        fields: [
          {
            id: 'field-1',
            name: 'primaryKey',
            type: 'string',
            isPK: true,
            isFK: false,
            visibleInERD: true,
          },
          {
            id: 'field-2',
            name: 'foreignKey',
            type: 'string',
            isPK: false,
            isFK: true,
            visibleInERD: false,
            fkReference: {
              targetEntityId: 'other-entity',
              targetFieldId: 'other-field',
              cardinality: 'one-to-many',
            },
          },
        ],
        position: { x: 123.45, y: 678.9 },
      });

      // Update entity name
      await service.updateEntity(project.id, entity.id, { name: 'Updated Name' });

      // Verify ALL fields are still present
      const retrievedProject = await service.getProject(project.id);
      const retrievedEntity = retrievedProject?.entities.find((e) => e.id === entity.id);

      expect(retrievedEntity?.name).toBe('Updated Name');
      expect(retrievedEntity?.type).toBe('dmo');
      expect(retrievedEntity?.businessPurpose).toBe('Complex Business Entity');
      expect(retrievedEntity?.implementationNotes).toBe('Entity with all fields');
      expect(retrievedEntity?.implementationStatus).toBe('in-progress');
      expect(retrievedEntity?.fields).toHaveLength(2);
      expect(retrievedEntity?.fields[0]?.isPK).toBe(true);
      expect(retrievedEntity?.fields[1]?.isFK).toBe(true);
      expect(retrievedEntity?.fields[1]?.fkReference?.cardinality).toBe('one-to-many');
      expect(retrievedEntity?.position).toEqual({ x: 123.45, y: 678.9 });
    });
  });
});
