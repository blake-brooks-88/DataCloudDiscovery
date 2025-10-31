import type { StorageService } from './StorageService.interface';
import {
  type ProjectDetail,
  type ProjectSummary,
  type InsertProject,
  type Entity,
  type InsertEntity,
  type Relationship,
  type InsertRelationship,
  type DataSource,
  type InsertDataSource,
  MockDbStateSchema,
  type MockDbState,
  ProjectDetailSchema,
  ProjectSummarySchema,
} from '@shared/schema';

export class LocalStorageService implements StorageService {
  private readonly STORAGE_KEY = 'data-cloud-projects';

  private loadDb(): MockDbState {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return { projects: [] };
      }
      const parsed = JSON.parse(data);
      return MockDbStateSchema.parse(parsed);
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return { projects: [] };
    }
  }

  private saveDb(db: MockDbState): void {
    try {
      const data = MockDbStateSchema.parse(db);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save projects to localStorage:', error);
      throw new Error('Storage quota exceeded or localStorage unavailable');
    }
  }

  private findProject(projects: ProjectDetail[], projectId: string): ProjectDetail | undefined {
    return projects.find((p) => p.id === projectId);
  }

  private touchProject(project: ProjectDetail): void {
    project.lastModified = Date.now();
  }

  async getAllProjects(): Promise<ProjectSummary[]> {
    const db = this.loadDb();
    // Return only summary data for list views
    return db.projects.map((p) => ProjectSummarySchema.parse(p));
  }

  async getProject(id: string): Promise<ProjectDetail | null> {
    const db = this.loadDb();
    return this.findProject(db.projects, id) || null;
  }

  async createProject(insertProject: InsertProject): Promise<ProjectDetail> {
    const db = this.loadDb();

    const now = Date.now();
    const newProject: ProjectDetail = {
      ...insertProject,
      id: crypto.randomUUID(),
      createdAt: now,
      lastModified: now,
      organizationId: 'org_personal_mock', // For mock-first dev
      entities: insertProject.entities || [],
      dataSources: insertProject.dataSources || [],
      relationships: insertProject.relationships || [],
    };

    const parsedProject = ProjectDetailSchema.parse(newProject);
    db.projects.push(parsedProject);
    this.saveDb(db);

    return parsedProject;
  }

  async updateProject(id: string, updates: Partial<ProjectDetail>): Promise<ProjectDetail> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, id);

    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }

    Object.assign(project, updates);
    this.touchProject(project);

    const parsedProject = ProjectDetailSchema.parse(project);
    this.saveDb(db);

    return parsedProject;
  }

  async deleteProject(id: string): Promise<void> {
    const db = this.loadDb();
    const filteredProjects = db.projects.filter((p) => p.id !== id);

    if (filteredProjects.length === db.projects.length) {
      throw new Error(`Project with id ${id} not found`);
    }

    this.saveDb({ projects: filteredProjects });
  }

  async createEntity(projectId: string, insertEntity: InsertEntity): Promise<Entity> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const newEntity: Entity = {
      ...insertEntity,
      id: crypto.randomUUID(),
    };

    project.entities.push(newEntity);
    this.touchProject(project);
    this.saveDb(db);

    return newEntity;
  }

  async updateEntity(
    projectId: string,
    entityId: string,
    updates: Partial<Entity>
  ): Promise<Entity> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const entity = project.entities.find((e) => e.id === entityId);
    if (!entity) {
      throw new Error(`Entity with id ${entityId} not found`);
    }

    Object.assign(entity, updates);
    this.touchProject(project);
    this.saveDb(db);

    return entity;
  }

  async deleteEntity(projectId: string, entityId: string): Promise<void> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const initialLength = project.entities.length;
    project.entities = project.entities.filter((e) => e.id !== entityId);

    if (project.entities.length === initialLength) {
      throw new Error(`Entity with id ${entityId} not found`);
    }

    if (project.relationships) {
      project.relationships = project.relationships.filter(
        (r) => r.sourceEntityId !== entityId && r.targetEntityId !== entityId
      );
    }

    this.touchProject(project);
    this.saveDb(db);
  }

  async createRelationship(
    projectId: string,
    insertRelationship: InsertRelationship
  ): Promise<Relationship> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const newRelationship: Relationship = {
      ...insertRelationship,
      id: crypto.randomUUID(),
    };

    if (!project.relationships) {
      project.relationships = [];
    }

    project.relationships.push(newRelationship);
    this.touchProject(project);
    this.saveDb(db);

    return newRelationship;
  }

  async updateRelationship(
    projectId: string,
    relationshipId: string,
    updates: Partial<Relationship>
  ): Promise<Relationship> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    if (!project.relationships) {
      throw new Error(`Relationship with id ${relationshipId} not found`);
    }

    const relationship = project.relationships.find((r) => r.id === relationshipId);
    if (!relationship) {
      throw new Error(`Relationship with id ${relationshipId} not found`);
    }

    Object.assign(relationship, updates);
    this.touchProject(project);
    this.saveDb(db);

    return relationship;
  }

  async deleteRelationship(projectId: string, relationshipId: string): Promise<void> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    if (!project.relationships) {
      throw new Error(`Relationship with id ${relationshipId} not found`);
    }

    const initialLength = project.relationships.length;
    project.relationships = project.relationships.filter((r) => r.id !== relationshipId);

    if (project.relationships.length === initialLength) {
      throw new Error(`Relationship with id ${relationshipId} not found`);
    }

    this.touchProject(project);
    this.saveDb(db);
  }

  async createDataSource(
    projectId: string,
    insertDataSource: InsertDataSource
  ): Promise<DataSource> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const newDataSource: DataSource = {
      ...insertDataSource,
      id: crypto.randomUUID(),
    };

    if (!project.dataSources) {
      project.dataSources = [];
    }

    project.dataSources.push(newDataSource);
    this.touchProject(project);
    this.saveDb(db);

    return newDataSource;
  }

  async updateDataSource(
    projectId: string,
    dataSourceId: string,
    updates: Partial<DataSource>
  ): Promise<DataSource> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    if (!project.dataSources) {
      throw new Error(`DataSource with id ${dataSourceId} not found`);
    }

    const dataSource = project.dataSources.find((ds) => ds.id === dataSourceId);
    if (!dataSource) {
      throw new Error(`DataSource with id ${dataSourceId} not found`);
    }

    Object.assign(dataSource, updates);
    this.touchProject(project);
    this.saveDb(db);

    return dataSource;
  }

  async deleteDataSource(projectId: string, dataSourceId: string): Promise<void> {
    const db = this.loadDb();
    const project = this.findProject(db.projects, projectId);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    if (!project.dataSources) {
      throw new Error(`DataSource with id ${dataSourceId} not found`);
    }

    const initialLength = project.dataSources.length;
    project.dataSources = project.dataSources.filter((ds) => ds.id !== dataSourceId);

    if (project.dataSources.length === initialLength) {
      throw new Error(`DataSource with id ${dataSourceId} not found`);
    }

    this.touchProject(project);
    this.saveDb(db);
  }
}
