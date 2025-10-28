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

export const storageKeys = {
    all: ['storage'] as const,
    projects: () => [...storageKeys.all, 'projects'] as const,
    project: (id: string) => [...storageKeys.projects(), id] as const,
};

export function useProjects() {
    const storage = useStorage();

    return useQuery({
        queryKey: storageKeys.projects(),
        queryFn: () => storage.getAllProjects(),
    });
}

export function useProject(projectId: string | null) {
    const storage = useStorage();

    return useQuery({
        queryKey: storageKeys.project(projectId || ''),
        queryFn: () => projectId ? storage.getProject(projectId) : null,
        enabled: !!projectId,
    });
}

export function useCreateProject() {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (project: InsertProject) => storage.createProject(project),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
        },
    });
}

export function useUpdateProject() {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
            storage.updateProject(id, updates),
        onSuccess: (updatedProject) => {
            queryClient.setQueryData(storageKeys.project(updatedProject.id), updatedProject);
            queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
        },
    });
}

export function useDeleteProject() {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: string) => storage.deleteProject(projectId),
        onSuccess: (_, projectId) => {
            queryClient.removeQueries({ queryKey: storageKeys.project(projectId) });
            queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
        },
    });
}

export function useCreateEntity(projectId: string) {
    const storage = useStorage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entity: InsertEntity) => storage.createEntity(projectId, entity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.project(projectId) });
        },
    });
}

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