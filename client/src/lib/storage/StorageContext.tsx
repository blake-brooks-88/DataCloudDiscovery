import { createContext, useContext, ReactNode } from 'react';
import type { StorageService } from './StorageService.interface';
import { LocalStorageService } from './LocalStorageService';

const StorageContext = createContext<StorageService | null>(null);

interface StorageProviderProps {
  children: ReactNode;
  storageService?: StorageService;
}

/**
 * Provides storage service to the component tree via React Context.
 * Defaults to LocalStorageService if no custom service provided.
 * 
 * @param {object} props
 * @param {ReactNode} props.children Components to wrap
 * @param {StorageService} [props.storageService] Optional custom storage implementation
 * @returns {JSX.Element}
 */
export function StorageProvider({ children, storageService }: StorageProviderProps) {
  const service = storageService || new LocalStorageService();

  return (
    <StorageContext.Provider value={service}>
      {children}
    </StorageContext.Provider>
  );
}

/**
 * Hook to access the storage service.
 * Must be used within a StorageProvider.
 * 
 * @returns {StorageService}
 * @throws {Error} If used outside StorageProvider
 */
export function useStorage(): StorageService {
  const context = useContext(StorageContext);

  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }

  return context;
}