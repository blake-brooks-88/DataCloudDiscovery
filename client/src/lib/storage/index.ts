/**
 * Storage Module
 * 
 * Complete storage abstraction layer for the Data Cloud Pipeline Visualizer.
 * 
 * This module provides:
 * - Storage interface for swappable implementations
 * - LocalStorage implementation (current)
 * - React Context for dependency injection
 * - React Query hooks for optimal state management
 * 
 * @example Basic usage
 * ```tsx
 * // 1. Wrap your app with StorageProvider
 * import { StorageProvider } from '@/lib/storage';
 * 
 * function App() {
 *   return (
 *     <StorageProvider>
 *       <YourApp />
 *     </StorageProvider>
 *   );
 * }
 * 
 * // 2. Use hooks in your components
 * import { useProjects, useCreateProject } from '@/lib/storage';
 * 
 * function ProjectList() {
 *   const { data: projects, isLoading } = useProjects();
 *   const createProject = useCreateProject();
 *   
 *   const handleCreate = async () => {
 *     await createProject.mutateAsync({
 *       name: 'New Project',
 *       entities: [],
 *     });
 *   };
 *   
 *   return (
 *     <div>
 *       {isLoading ? 'Loading...' : projects?.map(p => <div key={p.id}>{p.name}</div>)}
 *       <button onClick={handleCreate}>Create Project</button>
 *     </div>
 *   );
 * }
 * ```
 */

// Core interface
export type { StorageService } from './StorageService.interface';

// Implementations
export { LocalStorageService } from './LocalStorageService';

// React integration
export { StorageProvider, useStorage } from './StorageContext';

// React Query hooks
export {
    // Query keys
    storageKeys,

    // Project hooks
    useProjects,
    useProject,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,

    // Entity hooks
    useCreateEntity,
    useUpdateEntity,
    useDeleteEntity,

    // Relationship hooks
    useCreateRelationship,
    useUpdateRelationship,
    useDeleteRelationship,

    // Data source hooks
    useCreateDataSource,
    useUpdateDataSource,
    useDeleteDataSource,
} from './useStorage.hooks';