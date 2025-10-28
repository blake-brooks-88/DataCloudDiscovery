import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStorage } from './StorageContext';
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
 * Storage Hooks
 * 
 * These hooks integrate the storage service with React Query for:
 * - Automatic caching
 * - Optimistic updates
 * - Background refetching
 * - Loading/error states
 */

// =============================================================================
// QUERY KEYS
// =============================================================================

export const storageKeys = {
    all: ['storage'] as const,
    projects: () => [...storageKeys.all, 'projects'] as const,
    project: (id: string) => [...storageKeys.projects(), id] as const,
    entities: (projectId: string) => [...storageKeys.project(projectId), 'entities'] as const,
    relationships: (projectId: string) => [...storageKeys.project(projectId), 'relationships'] as const,
    dataSources: (projectId: string) => [...storageKeys.project(projectId), 'dataSources'] as const,
};

// =============================================================================
// PROJECT HOOKS
// =============================================================================

/**
 * Fetch all projects
 */
export function useProjects() {
    const storage = useStorage();

    return useQuery({
        queryKey: storageKeys.projects(),
        queryFn: () => storage.getAllProjects(),
    });
}

/**
 * Fetch a single project by ID
 */
export function useProject(projectId: string | null) {
    const storage = useStorage();

    return useQuery({
        queryKey: storageKeys.project(projectId || ''),
        queryFn: () => projectId ? storage.getProject(projectId) : null,
        enabled: !!projectId,
    });
}

/**
 * Create a new project
 */
export function useCreateProject() {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (project: InsertProject) => storage.createProject(project),
        onSuccess: () => {
            // Invalidate projects list to trigger refetch
            queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
        },
    });
}

/**
 * Update an existing project
 */
export function useUpdateProject() {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
            storage.updateProject(id, updates),
        onSuccess: (updatedProject) => {
            // Update specific project in cache
            queryClient.setQueryData(
                storageKeys.project(updatedProject.id),
                updatedProject
            );
            // Invalidate projects list
            queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
        },
    });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: string) => storage.deleteProject(projectId),
        onSuccess: (_, projectId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: storageKeys.project(projectId) });
            // Invalidate projects list
            queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
        },
    });
}

// =============================================================================
// ENTITY HOOKS
// =============================================================================

/**
 * Create a new entity
 */
export function useCreateEntity(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entity: InsertEntity) => storage.createEntity(projectId, entity),
        onSuccess: () => {
            // Invalidate project to trigger refetch with new entity
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

/**
 * Update an entity
 */
export function useUpdateEntity(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ entityId, updates }: { entityId: string; updates: Partial<Entity> }) =>
            storage.updateEntity(projectId, entityId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

/**
 * Delete an entity
 */
export function useDeleteEntity(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entityId: string) => storage.deleteEntity(projectId, entityId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

// =============================================================================
// RELATIONSHIP HOOKS
// =============================================================================

/**
 * Create a new relationship
 */
export function useCreateRelationship(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (relationship: InsertRelationship) =>
            storage.createRelationship(projectId, relationship),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

/**
 * Update a relationship
 */
export function useUpdateRelationship(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ relationshipId, updates }: { relationshipId: string; updates: Partial<Relationship> }) =>
            storage.updateRelationship(projectId, relationshipId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

/**
 * Delete a relationship
 */
export function useDeleteRelationship(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (relationshipId: string) =>
            storage.deleteRelationship(projectId, relationshipId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

// =============================================================================
// DATA SOURCE HOOKS
// =============================================================================

/**
 * Create a new data source
 */
export function useCreateDataSource(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dataSource: InsertDataSource) =>
            storage.createDataSource(projectId, dataSource),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

/**
 * Update a data source
 */
export function useUpdateDataSource(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ dataSourceId, updates }: { dataSourceId: string; updates: Partial<DataSource> }) =>
            storage.updateDataSource(projectId, dataSourceId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

/**
 * Delete a data source
 */
export function useDeleteDataSource(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dataSourceId: string) =>
            storage.deleteDataSource(projectId, dataSourceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}