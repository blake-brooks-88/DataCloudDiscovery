import { useState } from 'react';
import type { Entity, FieldType } from '@shared/schema';

type ViewMode = 'graph' | 'table';

/**
 * Manages entity view state including selection, filters, and modal visibility.
 * Separates UI state management from business logic.
 * 
 * @returns View state and state management functions
 */
export function useEntityViewState() {
    const [viewMode, setViewMode] = useState<ViewMode>('graph');
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<FieldType | 'all'>('all');
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

    const openCreateModal = () => {
        setEditingEntity(null);
        setIsEntityModalOpen(true);
    };

    const openEditModal = (entity: Entity) => {
        setEditingEntity(entity);
        setIsEntityModalOpen(true);
    };

    const closeModal = () => {
        setIsEntityModalOpen(false);
        setEditingEntity(null);
    };

    return {
        viewMode,
        setViewMode,
        selectedEntityId,
        setSelectedEntityId,
        searchQuery,
        setSearchQuery,
        typeFilter,
        setTypeFilter,
        isEntityModalOpen,
        editingEntity,
        openCreateModal,
        openEditModal,
        closeModal,
    };
}