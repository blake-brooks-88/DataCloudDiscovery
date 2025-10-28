import { createContext, useContext, ReactNode } from 'react';
import type { StorageService } from './StorageService.interface';
import { LocalStorageService } from './LocalStorageService';

/**
 * Storage Context
 * 
 * Provides the storage service to all components in the application.
 * This allows easy swapping of storage implementations without changing component code.
 */
const StorageContext = createContext<StorageService | null>(null);

interface StorageProviderProps {
  children: ReactNode;
  /**
   * Optional: Provide a custom storage service implementation
   * Defaults to LocalStorageService
   */
  storageService?: StorageService;
}

/**
 * Storage Provider Component
 * 
 * Wrap your app with this provider to enable storage access throughout the component tree.
 * 
 * @example
 * ```tsx
 * import { StorageProvider } from '@/lib/storage/StorageContext';
 * 
 * function App() {
 *   return (
 *     <StorageProvider>
 *       <YourApp />
 *     </StorageProvider>
 *   );
 * }
 * ```
 * 
 * @example With custom implementation
 * ```tsx
 * import { DatabaseService } from '@/lib/storage/DatabaseService';
 * 
 * function App() {
 *   const dbService = new DatabaseService(supabaseClient);
 *   
 *   return (
 *     <StorageProvider storageService={dbService}>
 *       <YourApp />
 *     </StorageProvider>
 *   );
 * }
 * ```
 */
export function StorageProvider({ children, storageService }: StorageProviderProps) {
  // Default to LocalStorageService if no service provided
  const service = storageService || new LocalStorageService();

  return (
    <StorageContext.Provider value={service}>
      {children}
    </StorageContext.Provider>
  );
}

/**
 * Hook to access the storage service
 * 
 * @throws Error if used outside of StorageProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const storage = useStorage();
 *   
 *   const loadProjects = async () => {
 *     const projects = await storage.getAllProjects();
 *     console.log(projects);
 *   };
 *   
 *   return <button onClick={loadProjects}>Load Projects</button>;
 * }
 * ```
 */
export function useStorage(): StorageService {
  const context = useContext(StorageContext);

  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }

  return context;
}