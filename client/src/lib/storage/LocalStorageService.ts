import type { StorageService } from './StorageService.interface';
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
 * LocalStorage Implementation of StorageService
 * 
 * This implementation stores all project data in browser localStorage.
 * Advantages:
 * - No backend required for initial development
 * - Works offline by default
 * - Simple and fast for prototyping
 * 
 * Limitations:
 * - Data is local to one browser/device
 * - No collaboration features
 * - Storage size limits (~5-10MB)
 * 
 * Future: Replace with DatabaseService for production use
 */
export class LocalStorageService implements StorageService {
    private readonly STORAGE_KEY = 'data-cloud-projects';

    // ==========================================================================
    // PRIVATE HELPER METHODS
    // ==========================================================================

    /**
     * Load all projects from localStorage
     */
    private loadProjects(): Project[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];

            const parsed = JSON.parse(data);
            return Array.isArray(parsed.projects) ? parsed.projects : [];
        } catch (error) {
            console.error('Failed to load projects from localStorage:', error);
            return [];
        }
    }

    /**
     * Save all projects to localStorage
     */
    private saveProjects(projects: Project[]): void {
        try {
            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify({ projects })
            );
        } catch (error) {
            console.error('Failed to save projects to localStorage:', error);
            throw new Error('Storage quota exceeded or localStorage unavailable');
        }
    }

    /**
     * Find a project by ID
     */
    private findProject(projects: Project[], projectId: string): Project | undefined {
        return projects.find(p => p.id === projectId);
    }

    /**
     * Update last modified timestamp
     */
    private touchProject(project: Project): void {
        project.lastModified = Date.now();
    }

    // ==========================================================================
    // PROJECT OPERATIONS
    // ==========================================================================

    async getAllProjects(): Promise<Project[]> {
        return this.loadProjects();
    }

    async getProject(id: string): Promise<Project | null> {
        const projects = this.loadProjects();
        return this.findProject(projects, id) || null;
    }

    async createProject(insertProject: InsertProject): Promise<Project> {
        const projects = this.loadProjects();

        const newProject: Project = {
            ...insertProject,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            lastModified: Date.now(),
            entities: insertProject.entities || [],
            dataSources: insertProject.dataSources || [],
            relationships: insertProject.relationships || [],
        };

        projects.push(newProject);
        this.saveProjects(projects);

        return newProject;
    }

    async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, id);

        if (!project) {
            throw new Error(`Project with id ${id} not found`);
        }

        // Apply updates
        Object.assign(project, updates);
        this.touchProject(project);

        this.saveProjects(projects);
        return project;
    }

    async deleteProject(id: string): Promise<void> {
        const projects = this.loadProjects();
        const filteredProjects = projects.filter(p => p.id !== id);

        if (filteredProjects.length === projects.length) {
            throw new Error(`Project with id ${id} not found`);
        }

        this.saveProjects(filteredProjects);
    }

    // ==========================================================================
    // ENTITY OPERATIONS
    // ==========================================================================

    async createEntity(projectId: string, insertEntity: InsertEntity): Promise<Entity> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

        if (!project) {
            throw new Error(`Project with id ${projectId} not found`);
        }

        const newEntity: Entity = {
            ...insertEntity,
            id: crypto.randomUUID(),
        };

        project.entities.push(newEntity);
        this.touchProject(project);
        this.saveProjects(projects);

        return newEntity;
    }

    async updateEntity(
        projectId: string,
        entityId: string,
        updates: Partial<Entity>
    ): Promise<Entity> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

        if (!project) {
            throw new Error(`Project with id ${projectId} not found`);
        }

        const entity = project.entities.find(e => e.id === entityId);
        if (!entity) {
            throw new Error(`Entity with id ${entityId} not found`);
        }

        // Apply updates
        Object.assign(entity, updates);
        this.touchProject(project);
        this.saveProjects(projects);

        return entity;
    }

    async deleteEntity(projectId: string, entityId: string): Promise<void> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

        if (!project) {
            throw new Error(`Project with id ${projectId} not found`);
        }

        const initialLength = project.entities.length;
        project.entities = project.entities.filter(e => e.id !== entityId);

        if (project.entities.length === initialLength) {
            throw new Error(`Entity with id ${entityId} not found`);
        }

        // Also remove any relationships involving this entity
        if (project.relationships) {
            project.relationships = project.relationships.filter(
                r => r.sourceEntityId !== entityId && r.targetEntityId !== entityId
            );
        }

        this.touchProject(project);
        this.saveProjects(projects);
    }

    // ==========================================================================
    // RELATIONSHIP OPERATIONS
    // ==========================================================================

    async createRelationship(
        projectId: string,
        insertRelationship: InsertRelationship
    ): Promise<Relationship> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

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
        this.saveProjects(projects);

        return newRelationship;
    }

    async updateRelationship(
        projectId: string,
        relationshipId: string,
        updates: Partial<Relationship>
    ): Promise<Relationship> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

        if (!project) {
            throw new Error(`Project with id ${projectId} not found`);
        }

        if (!project.relationships) {
            throw new Error(`Relationship with id ${relationshipId} not found`);
        }

        const relationship = project.relationships.find(r => r.id === relationshipId);
        if (!relationship) {
            throw new Error(`Relationship with id ${relationshipId} not found`);
        }

        // Apply updates
        Object.assign(relationship, updates);
        this.touchProject(project);
        this.saveProjects(projects);

        return relationship;
    }

    async deleteRelationship(projectId: string, relationshipId: string): Promise<void> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

        if (!project) {
            throw new Error(`Project with id ${projectId} not found`);
        }

        if (!project.relationships) {
            throw new Error(`Relationship with id ${relationshipId} not found`);
        }

        const initialLength = project.relationships.length;
        project.relationships = project.relationships.filter(r => r.id !== relationshipId);

        if (project.relationships.length === initialLength) {
            throw new Error(`Relationship with id ${relationshipId} not found`);
        }

        this.touchProject(project);
        this.saveProjects(projects);
    }

    // ==========================================================================
    // DATA SOURCE OPERATIONS
    // ==========================================================================

    async createDataSource(
        projectId: string,
        insertDataSource: InsertDataSource
    ): Promise<DataSource> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

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
        this.saveProjects(projects);

        return newDataSource;
    }

    async updateDataSource(
        projectId: string,
        dataSourceId: string,
        updates: Partial<DataSource>
    ): Promise<DataSource> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

        if (!project) {
            throw new Error(`Project with id ${projectId} not found`);
        }

        if (!project.dataSources) {
            throw new Error(`DataSource with id ${dataSourceId} not found`);
        }

        const dataSource = project.dataSources.find(ds => ds.id === dataSourceId);
        if (!dataSource) {
            throw new Error(`DataSource with id ${dataSourceId} not found`);
        }

        // Apply updates
        Object.assign(dataSource, updates);
        this.touchProject(project);
        this.saveProjects(projects);

        return dataSource;
    }

    async deleteDataSource(projectId: string, dataSourceId: string): Promise<void> {
        const projects = this.loadProjects();
        const project = this.findProject(projects, projectId);

        if (!project) {
            throw new Error(`Project with id ${projectId} not found`);
        }

        if (!project.dataSources) {
            throw new Error(`DataSource with id ${dataSourceId} not found`);
        }

        const initialLength = project.dataSources.length;
        project.dataSources = project.dataSources.filter(ds => ds.id !== dataSourceId);

        if (project.dataSources.length === initialLength) {
            throw new Error(`DataSource with id ${dataSourceId} not found`);
        }

        this.touchProject(project);
        this.saveProjects(projects);
    }
}