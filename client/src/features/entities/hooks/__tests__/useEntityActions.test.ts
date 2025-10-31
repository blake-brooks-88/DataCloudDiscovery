import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEntityActions } from '../useEntityActions';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useCreateRelationship,
} from '@/lib/storage';
import type { Entity, InsertEntity, ProjectDetail } from '@shared/schema';

// Mock dependencies
vi.mock('@/hooks/use-toast');
vi.mock('@/lib/storage');

// Helper function to create mock ProjectDetail
function createMockProject(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    id: 'test-project-123',
    name: 'Test Project',
    createdAt: Date.now(),
    lastModified: Date.now(),
    organizationId: 'org-123',
    entities: [],
    relationships: [],
    dataSources: [],
    ...overrides,
  };
}

describe('useEntityActions', () => {
  const mockProjectId = 'test-project-123';
  const mockToast = vi.fn();
  const mockOnOpenEditModal = vi.fn();

  // Mock mutation functions
  const mockCreateEntityMutateAsync = vi.fn();
  const mockUpdateEntityMutateAsync = vi.fn();
  const mockDeleteEntityMutateAsync = vi.fn();
  const mockCreateRelationshipMutateAsync = vi.fn();

  // Mock confirm dialog
  const originalConfirm = global.confirm;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useToast
    (useToast as Mock).mockReturnValue({
      toast: mockToast,
    });

    // Mock storage hooks
    (useCreateEntity as Mock).mockReturnValue({
      mutateAsync: mockCreateEntityMutateAsync,
      isPending: false,
    });

    (useUpdateEntity as Mock).mockReturnValue({
      mutateAsync: mockUpdateEntityMutateAsync,
      isPending: false,
    });

    (useDeleteEntity as Mock).mockReturnValue({
      mutateAsync: mockDeleteEntityMutateAsync,
      isPending: false,
    });

    (useCreateRelationship as Mock).mockReturnValue({
      mutateAsync: mockCreateRelationshipMutateAsync,
      isPending: false,
    });

    // Mock confirm dialog
    global.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    global.confirm = originalConfirm;
  });

  describe('handleCreate', () => {
    it('should create entity and show success toast', async () => {
      const newEntity: InsertEntity = {
        name: 'Test Entity',
        type: 'data-stream',
        fields: [],
      };

      const createdEntity: Entity = {
        id: 'entity-1',
        ...newEntity,
        fields: [],
      };

      mockCreateEntityMutateAsync.mockResolvedValue(createdEntity);

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleCreate(newEntity);

      expect(mockCreateEntityMutateAsync).toHaveBeenCalledWith(newEntity);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Entity created successfully',
      });
    });

    it('should show error toast when creation fails', async () => {
      const newEntity: InsertEntity = {
        name: 'Test Entity',
        type: 'data-stream',
        fields: [],
      };

      mockCreateEntityMutateAsync.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleCreate(newEntity);

      expect(mockCreateEntityMutateAsync).toHaveBeenCalledWith(newEntity);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to create entity',
        variant: 'destructive',
      });
    });

    it('should not create entity when projectId is empty', async () => {
      const newEntity: InsertEntity = {
        name: 'Test Entity',
        type: 'data-stream',
        fields: [],
      };

      const { result } = renderHook(() =>
        useEntityActions('', null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleCreate(newEntity);

      expect(mockCreateEntityMutateAsync).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('handleUpdate', () => {
    it('should update entity', async () => {
      const entityId = 'entity-1';
      const updates: Partial<Entity> = {
        name: 'Updated Name',
      };

      const updatedEntity: Entity = {
        id: entityId,
        name: 'Updated Name',
        type: 'data-stream',
        fields: [],
      };

      mockUpdateEntityMutateAsync.mockResolvedValue(updatedEntity);

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleUpdate(entityId, updates);

      expect(mockUpdateEntityMutateAsync).toHaveBeenCalledWith({ entityId, updates });
    });

    it('should show error toast when update fails', async () => {
      const entityId = 'entity-1';
      const updates: Partial<Entity> = {
        name: 'Updated Name',
      };

      mockUpdateEntityMutateAsync.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleUpdate(entityId, updates);

      expect(mockUpdateEntityMutateAsync).toHaveBeenCalledWith({ entityId, updates });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to update entity',
        variant: 'destructive',
      });
    });

    it('should not update entity when projectId is empty', async () => {
      const entityId = 'entity-1';
      const updates: Partial<Entity> = {
        name: 'Updated Name',
      };

      const { result } = renderHook(() =>
        useEntityActions('', null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleUpdate(entityId, updates);

      expect(mockUpdateEntityMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('handleUpdatePosition (CRITICAL)', () => {
    it('should update entity position', async () => {
      const entityId = 'entity-1';
      const position = { x: 200, y: 300 };

      const updatedEntity: Entity = {
        id: entityId,
        name: 'Test Entity',
        type: 'data-stream',
        fields: [],
        position,
      };

      mockUpdateEntityMutateAsync.mockResolvedValue(updatedEntity);

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleUpdatePosition(entityId, position);

      expect(mockUpdateEntityMutateAsync).toHaveBeenCalledWith({
        entityId,
        updates: { position },
      });
    });

    it('should throw error when position update fails', async () => {
      const entityId = 'entity-1';
      const position = { x: 200, y: 300 };
      const error = new Error('Position update failed');

      mockUpdateEntityMutateAsync.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await expect(result.current.handleUpdatePosition(entityId, position)).rejects.toThrow(
        'Position update failed'
      );

      expect(mockUpdateEntityMutateAsync).toHaveBeenCalledWith({
        entityId,
        updates: { position },
      });
    });

    it('should not update position when projectId is empty', async () => {
      const entityId = 'entity-1';
      const position = { x: 200, y: 300 };

      const { result } = renderHook(() =>
        useEntityActions('', null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleUpdatePosition(entityId, position);

      expect(mockUpdateEntityMutateAsync).not.toHaveBeenCalled();
    });

    it('should persist position coordinates correctly', async () => {
      const entityId = 'entity-1';
      const position = { x: 450.5, y: 789.25 };

      mockUpdateEntityMutateAsync.mockResolvedValue({
        id: entityId,
        name: 'Test',
        type: 'data-stream',
        fields: [],
        position,
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleUpdatePosition(entityId, position);

      const updateCall = mockUpdateEntityMutateAsync.mock.calls[0]?.[0];
      expect(updateCall?.updates.position).toEqual({ x: 450.5, y: 789.25 });
    });
  });

  describe('handleDelete', () => {
    it('should delete entity when user confirms', async () => {
      const entityId = 'entity-1';

      mockDeleteEntityMutateAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleDelete(entityId);

      expect(global.confirm).toHaveBeenCalledWith('Delete this entity? This cannot be undone.');
      expect(mockDeleteEntityMutateAsync).toHaveBeenCalledWith(entityId);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Entity deleted',
      });
    });

    it('should not delete entity when user cancels', async () => {
      const entityId = 'entity-1';

      (global.confirm as Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleDelete(entityId);

      expect(global.confirm).toHaveBeenCalled();
      expect(mockDeleteEntityMutateAsync).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should show error toast when deletion fails', async () => {
      const entityId = 'entity-1';

      mockDeleteEntityMutateAsync.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleDelete(entityId);

      expect(mockDeleteEntityMutateAsync).toHaveBeenCalledWith(entityId);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to delete entity',
        variant: 'destructive',
      });
    });

    it('should not delete entity when projectId is empty', async () => {
      const entityId = 'entity-1';

      const { result } = renderHook(() =>
        useEntityActions('', null, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.handleDelete(entityId);

      expect(mockDeleteEntityMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('handleEntityDoubleClick', () => {
    it('should open edit modal with entity data', () => {
      const entity: Entity = {
        id: 'entity-1',
        name: 'Test Entity',
        type: 'data-stream',
        fields: [],
      };

      const currentProject = createMockProject({
        entities: [entity],
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      result.current.handleEntityDoubleClick('entity-1');

      expect(mockOnOpenEditModal).toHaveBeenCalledWith(entity);
    });

    it('should not open modal when entity not found', () => {
      const currentProject = createMockProject();

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      result.current.handleEntityDoubleClick('non-existent-id');

      expect(mockOnOpenEditModal).not.toHaveBeenCalled();
    });

    it('should not open modal when currentProject is null', () => {
      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      result.current.handleEntityDoubleClick('entity-1');

      expect(mockOnOpenEditModal).not.toHaveBeenCalled();
    });
  });

  describe('generateDLO', () => {
    it('should generate DLO from data-stream', async () => {
      const dataStream: Entity = {
        id: 'stream-1',
        name: 'Customer Stream',
        type: 'data-stream',
        fields: [
          {
            id: 'field-1',
            name: 'email',
            type: 'string',
            isPK: false,
            isFK: false,
            visibleInERD: true,
          },
        ],
        position: { x: 100, y: 200 },
      };

      const currentProject = createMockProject({
        entities: [dataStream],
      });

      const createdDLO: Entity = {
        id: 'dlo-1',
        name: 'Customer DLO',
        type: 'dlo',
        fields: dataStream.fields,
        sourceDataStreamId: 'stream-1',
        position: { x: 100, y: 440 },
      };

      mockCreateEntityMutateAsync.mockResolvedValue(createdDLO);
      mockCreateRelationshipMutateAsync.mockResolvedValue({
        id: 'rel-1',
        type: 'feeds-into',
        sourceEntityId: 'stream-1',
        targetEntityId: 'dlo-1',
        label: 'Ingests',
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.generateDLO('stream-1');

      // Verify DLO entity creation
      const createCall = mockCreateEntityMutateAsync.mock.calls[0]?.[0];
      expect(createCall?.name).toBe('Customer DLO');
      expect(createCall?.type).toBe('dlo');
      expect(createCall?.sourceDataStreamId).toBe('stream-1');
      expect(createCall?.position).toEqual({ x: 100, y: 440 });
      expect(createCall?.fields).toHaveLength(1);

      // Verify relationship creation
      expect(mockCreateRelationshipMutateAsync).toHaveBeenCalledWith({
        type: 'feeds-into',
        sourceEntityId: 'stream-1',
        targetEntityId: 'dlo-1',
        label: 'Ingests',
      });

      // Verify success toast
      expect(mockToast).toHaveBeenCalledWith({
        title: 'DLO generated successfully',
      });
    });

    it('should not generate DLO when entity is not data-stream', async () => {
      const dlo: Entity = {
        id: 'dlo-1',
        name: 'Customer DLO',
        type: 'dlo',
        fields: [],
      };

      const currentProject = createMockProject({
        entities: [dlo],
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.generateDLO('dlo-1');

      expect(mockCreateEntityMutateAsync).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should show error toast when DLO generation fails', async () => {
      const dataStream: Entity = {
        id: 'stream-1',
        name: 'Customer Stream',
        type: 'data-stream',
        fields: [],
        position: { x: 100, y: 200 },
      };

      const currentProject = createMockProject({
        entities: [dataStream],
      });

      mockCreateEntityMutateAsync.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.generateDLO('stream-1');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to generate DLO',
        variant: 'destructive',
      });
    });

    it('should handle missing position when generating DLO', async () => {
      const dataStream: Entity = {
        id: 'stream-1',
        name: 'Customer Stream',
        type: 'data-stream',
        fields: [],
        // No position
      };

      const currentProject = createMockProject({
        entities: [dataStream],
      });

      mockCreateEntityMutateAsync.mockResolvedValue({
        id: 'dlo-1',
        name: 'Customer DLO',
        type: 'dlo',
        fields: [],
        position: { x: 0, y: 240 },
      });

      mockCreateRelationshipMutateAsync.mockResolvedValue({
        id: 'rel-1',
        type: 'feeds-into',
        sourceEntityId: 'stream-1',
        targetEntityId: 'dlo-1',
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.generateDLO('stream-1');

      const createCall = mockCreateEntityMutateAsync.mock.calls[0]?.[0];
      expect(createCall?.position).toEqual({ x: 0, y: 240 });
    });
  });

  describe('generateDMO', () => {
    it('should generate DMO from DLO', async () => {
      const dlo: Entity = {
        id: 'dlo-1',
        name: 'Customer DLO',
        type: 'dlo',
        fields: [
          {
            id: 'field-1',
            name: 'email',
            type: 'string',
            isPK: false,
            isFK: false,
            visibleInERD: true,
          },
        ],
        position: { x: 100, y: 440 },
      };

      const currentProject = createMockProject({
        entities: [dlo],
      });

      const createdDMO: Entity = {
        id: 'dmo-1',
        name: 'Customer DMO',
        type: 'dmo',
        fields: dlo.fields,
        sourceDLOIds: ['dlo-1'],
        position: { x: 100, y: 680 },
      };

      mockCreateEntityMutateAsync.mockResolvedValue(createdDMO);
      mockCreateRelationshipMutateAsync.mockResolvedValue({
        id: 'rel-1',
        type: 'transforms-to',
        sourceEntityId: 'dlo-1',
        targetEntityId: 'dmo-1',
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.generateDMO('dlo-1');

      // Verify DMO entity creation
      const createCall = mockCreateEntityMutateAsync.mock.calls[0]?.[0];
      expect(createCall?.name).toBe('Customer DMO');
      expect(createCall?.type).toBe('dmo');
      expect(createCall?.sourceDLOIds).toEqual(['dlo-1']);
      expect(createCall?.position).toEqual({ x: 100, y: 680 });
      expect(createCall?.fields).toHaveLength(1);

      // Verify relationship creation
      expect(mockCreateRelationshipMutateAsync).toHaveBeenCalledWith({
        type: 'transforms-to',
        sourceEntityId: 'dlo-1',
        targetEntityId: 'dmo-1',
      });

      // Verify success toast
      expect(mockToast).toHaveBeenCalledWith({
        title: 'DMO generated successfully',
      });
    });

    it('should not generate DMO when entity is not DLO', async () => {
      const dataStream: Entity = {
        id: 'stream-1',
        name: 'Customer Stream',
        type: 'data-stream',
        fields: [],
      };

      const currentProject = createMockProject({
        entities: [dataStream],
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.generateDMO('stream-1');

      expect(mockCreateEntityMutateAsync).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should show error toast when DMO generation fails', async () => {
      const dlo: Entity = {
        id: 'dlo-1',
        name: 'Customer DLO',
        type: 'dlo',
        fields: [],
        position: { x: 100, y: 440 },
      };

      const currentProject = createMockProject({
        entities: [dlo],
      });

      mockCreateEntityMutateAsync.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, currentProject, { onOpenEditModal: mockOnOpenEditModal })
      );

      await result.current.generateDMO('dlo-1');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to generate DMO',
        variant: 'destructive',
      });
    });
  });

  describe('loading states', () => {
    it('should expose isCreating state', () => {
      (useCreateEntity as Mock).mockReturnValue({
        mutateAsync: mockCreateEntityMutateAsync,
        isPending: true,
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      expect(result.current.isCreating).toBe(true);
    });

    it('should expose isUpdating state', () => {
      (useUpdateEntity as Mock).mockReturnValue({
        mutateAsync: mockUpdateEntityMutateAsync,
        isPending: true,
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      expect(result.current.isUpdating).toBe(true);
    });

    it('should expose isDeleting state', () => {
      (useDeleteEntity as Mock).mockReturnValue({
        mutateAsync: mockDeleteEntityMutateAsync,
        isPending: true,
      });

      const { result } = renderHook(() =>
        useEntityActions(mockProjectId, null, { onOpenEditModal: mockOnOpenEditModal })
      );

      expect(result.current.isDeleting).toBe(true);
    });
  });
});
