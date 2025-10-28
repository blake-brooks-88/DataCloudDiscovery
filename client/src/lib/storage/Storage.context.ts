import { createContext, useContext } from 'react';
import type { StorageService } from './StorageService.interface';

export const StorageContext = createContext<StorageService | null>(null);

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
