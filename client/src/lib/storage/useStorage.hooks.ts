import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStorage } from './Storage.context';
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

export const storageKeys = {
  all: ['storage'] as const,
  projects: () => [...storageKeys.all, 'projects'] as const,
  project: (id: string) => [...storageKeys.projects(), id] as const,
};

/**
 * Fetches a list of all project summaries.
 */
export function useProjects() {
  const storage = useStorage();

  return useQuery<ProjectSummary[], Error>({
    queryKey: storageKeys.projects(),
    queryFn: () => storage.getAllProjects(),
  });
}

/**
 * Fetches the full details for a single project.
 * @param projectId The ID of the project to fetch, or null.
 */
export function useProject(projectId: string | null) {
  const storage = useStorage();

  return useQuery<ProjectDetail | null, Error>({
    queryKey: storageKeys.project(projectId || ''),
    queryFn: () => (projectId ? storage.getProject(projectId) : null),
    enabled: !!projectId,
  });
}

/**
 * Provides a mutation for creating a new project.
 */
export function useCreateProject() {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<ProjectDetail, Error, InsertProject>({
    mutationFn: (project: InsertProject) => storage.createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
    },
  });
}

/**
 * Provides a mutation for updating an existing project.
 */
export function useUpdateProject() {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<ProjectDetail, Error, { id: string; updates: Partial<ProjectDetail> }>({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectDetail> }) =>
      storage.updateProject(id, updates),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(storageKeys.project(updatedProject.id), updatedProject);
      queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
    },
  });
}

/**
 * Provides a mutation for deleting a project.
 */
export function useDeleteProject() {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (projectId: string) => storage.deleteProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.removeQueries({ queryKey: storageKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.projects() });
    },
  });
}

/**
 * Provides a mutation for creating a new entity within a project.
 * @param projectId The ID of the parent project.
 */
export function useCreateEntity(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<Entity, Error, InsertEntity>({
    mutationFn: (entity: InsertEntity) => storage.createEntity(projectId, entity),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for updating an entity within a project.
 * @param projectId The ID of the parent project.
 */
export function useUpdateEntity(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<Entity, Error, { entityId: string; updates: Partial<Entity> }>({
    mutationFn: ({ entityId, updates }: { entityId: string; updates: Partial<Entity> }) =>
      storage.updateEntity(projectId, entityId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for deleting an entity from a project.
 * @param projectId The ID of the parent project.
 */
export function useDeleteEntity(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (entityId: string) => storage.deleteEntity(projectId, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for creating a new relationship within a project.
 * @param projectId The ID of the parent project.
 */
export function useCreateRelationship(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<Relationship, Error, InsertRelationship>({
    mutationFn: (relationship: InsertRelationship) =>
      storage.createRelationship(projectId, relationship),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for updating a relationship within a project.
 * @param projectId The ID of the parent project.
 */
export function useUpdateRelationship(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<
    Relationship,
    Error,
    { relationshipId: string; updates: Partial<Relationship> }
  >({
    mutationFn: ({
      relationshipId,
      updates,
    }: {
      relationshipId: string;
      updates: Partial<Relationship>;
    }) => storage.updateRelationship(projectId, relationshipId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for deleting a relationship from a project.
 * @param projectId The ID of the parent project.
 */
export function useDeleteRelationship(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (relationshipId: string) => storage.deleteRelationship(projectId, relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for creating a new data source within a project.
 * @param projectId The ID of the parent project.
 */
export function useCreateDataSource(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<DataSource, Error, InsertDataSource>({
    mutationFn: (dataSource: InsertDataSource) => storage.createDataSource(projectId, dataSource),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for updating a data source within a project.
 * @param projectId The ID of the parent project.
 */
export function useUpdateDataSource(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<DataSource, Error, { dataSourceId: string; updates: Partial<DataSource> }>({
    mutationFn: ({
      dataSourceId,
      updates,
    }: {
      dataSourceId: string;
      updates: Partial<DataSource>;
    }) => storage.updateDataSource(projectId, dataSourceId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}

/**
 * Provides a mutation for deleting a data source from a project.
 * @param projectId The ID of the parent project.
 */
export function useDeleteDataSource(projectId: string) {
  const storage = useStorage();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (dataSourceId: string) => storage.deleteDataSource(projectId, dataSourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.project(projectId),
      });
    },
  });
}
