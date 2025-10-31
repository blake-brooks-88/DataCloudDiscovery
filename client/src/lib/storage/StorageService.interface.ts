import type {
  ProjectDetail,
  ProjectSummary,
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
  /**
   * Retrieves all projects available to the user.
   * @returns A promise that resolves to an array of project summaries.
   */
  getAllProjects(): Promise<ProjectSummary[]>;

  /**
   * Retrieves a single project by its unique ID.
   * @param id - The ID of the project to retrieve.
   * @returns A promise that resolves to the full project detail or null if not found.
   */
  getProject(id: string): Promise<ProjectDetail | null>;

  /**
   * Creates a new project.
   * @param project - The project data to create.
   * @returns A promise that resolves to the newly created full project detail.
   */
  createProject(project: InsertProject): Promise<ProjectDetail>;

  /**
   * Updates an existing project.
   * @param id - The ID of the project to update.
   * @param updates - The partial project data to apply.
   * @returns A promise that resolves to the updated full project detail.
   */
  updateProject(id: string, updates: Partial<ProjectDetail>): Promise<ProjectDetail>;

  /**
   * Deletes a project by its unique ID.
   * @param id - The ID of the project to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  deleteProject(id: string): Promise<void>;

  /**
   * Creates a new entity within a project.
   * @param projectId - The ID of the parent project.
   * @param entity - The entity data to create.
   * @returns A promise that resolves to the newly created entity.
   */
  createEntity(projectId: string, entity: InsertEntity): Promise<Entity>;

  /**
   * Updates an existing entity within a project.
   * @param projectId - The ID of the parent project.
   * @param entityId - The ID of the entity to update.
   * @param updates - The partial entity data to apply.
   * @returns A promise that resolves to the updated entity.
   */
  updateEntity(projectId: string, entityId: string, updates: Partial<Entity>): Promise<Entity>;

  /**
   * Deletes an entity from a project.
   * @param projectId - The ID of the parent project.
   * @param entityId - The ID of the entity to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  deleteEntity(projectId: string, entityId: string): Promise<void>;

  /**
   * Creates a new relationship within a project.
   * @param projectId - The ID of the parent project.
   * @param relationship - The relationship data to create.
   * @returns A promise that resolves to the newly created relationship.
   */
  createRelationship(projectId: string, relationship: InsertRelationship): Promise<Relationship>;

  /**
   * Updates an existing relationship within a project.
   * @param projectId - The ID of the parent project.
   * @param relationshipId - The ID of the relationship to update.
   * @param updates - The partial relationship data to apply.
   * @returns A promise that resolves to the updated relationship.
   */
  updateRelationship(
    projectId: string,
    relationshipId: string,
    updates: Partial<Relationship>
  ): Promise<Relationship>;

  /**
   * Deletes a relationship from a project.
   * @param projectId - The ID of the parent project.
   * @param relationshipId - The ID of the relationship to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  deleteRelationship(projectId: string, relationshipId: string): Promise<void>;

  /**
   * Creates a new data source within a project.
   * @param projectId - The ID of the parent project.
   * @param dataSource - The data source data to create.
   * @returns A promise that resolves to the newly created data source.
   */
  createDataSource(projectId: string, dataSource: InsertDataSource): Promise<DataSource>;

  /**
   * Updates an existing data source within a project.
   * @param projectId - The ID of the parent project.
   * @param dataSourceId - The ID of the data source to update.
   * @param updates - The partial data source data to apply.
   * @returns A promise that resolves to the updated data source.
   */
  updateDataSource(
    projectId: string,
    dataSourceId: string,
    updates: Partial<DataSource>
  ): Promise<DataSource>;

  /**
   * Deletes a data source from a project.
   * @param projectId - The ID of the parent project.
   * @param dataSourceId - The ID of the data source to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  deleteDataSource(projectId: string, dataSourceId: string): Promise<void>;
}
