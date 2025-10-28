import type {
    Project,
    InsertProject,
    Entity,
    InsertEntity,
    Relationship,
    InsertRelationship,
    DataSource,
    InsertDataSource,
} from '@shared/schema';

/**
 * Storage abstraction for all data persistence operations.
 * Enables swapping between localStorage, database, or other backends without changing component code.
 */
export interface StorageService {
    getAllProjects(): Promise<Project[]>;
    getProject(id: string): Promise<Project | null>;
    createProject(project: InsertProject): Promise<Project>;
    updateProject(id: string, updates: Partial<Project>): Promise<Project>;
    deleteProject(id: string): Promise<void>;

    createEntity(projectId: string, entity: InsertEntity): Promise<Entity>;
    updateEntity(projectId: string, entityId: string, updates: Partial<Entity>): Promise<Entity>;
    deleteEntity(projectId: string, entityId: string): Promise<void>;

    createRelationship(projectId: string, relationship: InsertRelationship): Promise<Relationship>;
    updateRelationship(projectId: string, relationshipId: string, updates: Partial<Relationship>): Promise<Relationship>;
    deleteRelationship(projectId: string, relationshipId: string): Promise<void>;

    createDataSource(projectId: string, dataSource: InsertDataSource): Promise<DataSource>;
    updateDataSource(projectId: string, dataSourceId: string, updates: Partial<DataSource>): Promise<DataSource>;
    deleteDataSource(projectId: string, dataSourceId: string): Promise<void>;
}