import { useState, useCallback } from 'react';
import type { Entity } from '@shared/schema';

export type ViewMode = 'graph' | 'table';

interface EntityViewState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isEntityModalOpen: boolean;
  editingEntity: Entity | null;
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;
  openCreateModal: () => void;
  openEditModal: (entity: Entity) => void;
  closeModal: () => void;
}

/**
 * Hook for managing entity view state (modals, view mode, selection).
 * NOTE: Search state has been moved to useSearchState to prevent unnecessary re-renders.
 *
 * @returns View state management methods and values
 */
export function useEntityViewState(): EntityViewState {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const openCreateModal = useCallback(() => {
    setEditingEntity(null);
    setIsEntityModalOpen(true);
  }, []);

  const openEditModal = useCallback((entity: Entity) => {
    setEditingEntity(entity);
    setIsEntityModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsEntityModalOpen(false);
    setEditingEntity(null);
  }, []);

  return {
    viewMode,
    setViewMode,
    isEntityModalOpen,
    editingEntity,
    selectedEntityId,
    setSelectedEntityId,
    openCreateModal,
    openEditModal,
    closeModal,
  };
}
