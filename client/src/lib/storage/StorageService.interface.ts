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
 * Storage Service Interface
 * 
 * This interface provides an abstraction layer for all data persistence operations.
 * Benefits:
 * - Easy to swap between localStorage, database, or any other storage backend
 * - Makes testing straightforward with mock implementations
 * - Enables offline-first patterns with sync capabilities
 * - Supports future real-time collaboration features
 */
export interface StorageService {
    // ============================================================================
    // PROJECT OPERATIONS
    // ============================================================================

    /**
     * Retrieve all projects for the current user
     */
    getAllProjects(): Promise<Project[]>;

    /**
     * Get a single project by ID
     * @returns Project if found, null otherwise
     */
    getProject(id: string): Promise<Project | null>;

    /**
     * Create a new project
     * @returns The created project with generated ID and timestamps
     */
    createProject(project: InsertProject): Promise<Project>;

    /**
     * Update an existing project
     * @returns The updated project
     */
    updateProject(id: string, updates: Partial<Project>): Promise<Project>;

    /**
     * Delete a project and all its associated data
     */
    deleteProject(id: string): Promise<void>;

    // ============================================================================
    // ENTITY OPERATIONS
    // ============================================================================

    /**
     * Create a new entity within a project
     */
    createEntity(projectId: string, entity: InsertEntity): Promise<Entity>;

    /**
     * Update an existing entity
     */
    updateEntity(projectId: string, entityId: string, updates: Partial<Entity>): Promise<Entity>;

    /**
     * Delete an entity from a project
     */
    deleteEntity(projectId: string, entityId: string): Promise<void>;

    // ============================================================================
    // RELATIONSHIP OPERATIONS
    // ============================================================================

    /**
     * Create a new relationship between entities
     */
    createRelationship(projectId: string, relationship: InsertRelationship): Promise<Relationship>;

    /**
     * Update an existing relationship
     */
    updateRelationship(
        projectId: string,
        relationshipId: string,
        updates: Partial<Relationship>
    ): Promise<Relationship>;

    /**
     * Delete a relationship
     */
    deleteRelationship(projectId: string, relationshipId: string): Promise<void>;

    // ============================================================================
    // DATA SOURCE OPERATIONS
    // ============================================================================

    /**
     * Create a new data source within a project
     */
    createDataSource(projectId: string, dataSource: InsertDataSource): Promise<DataSource>;

    /**
     * Update an existing data source
     */
    updateDataSource(
        projectId: string,
        dataSourceId: string,
        updates: Partial<DataSource>
    ): Promise<DataSource>;

    /**
     * Delete a data source
     */
    deleteDataSource(projectId: string, dataSourceId: string): Promise<void>;
}