import { ReactNode } from 'react';
import { StorageContext } from './Storage.context'; // <-- Import from the new file
import type { StorageService } from './StorageService.interface';
import { LocalStorageService } from './LocalStorageService';

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

  return <StorageContext.Provider value={service}>{children}</StorageContext.Provider>;
}
