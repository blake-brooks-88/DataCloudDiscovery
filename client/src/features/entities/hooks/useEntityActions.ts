import { useToast } from '@/hooks/use-toast';
import {
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useCreateRelationship,
} from '@/lib/storage';
import type { Entity, InsertEntity, ProjectDetail } from '@shared/schema';

/**
 * @hook useEntityActions
 * @description Provides entity management operations for the current project.
 * Handles CRUD operations, DLO/DMO generation, and user feedback.
 *
 * @param {string} projectId - Current project ID
 * @param {ProjectDetail | null | undefined} currentProject - Full project data for DLO/DMO generation
 * @param {object} callbacks - UI state callbacks
 * @param {function} callbacks.onOpenEditModal - Callback to open entity modal in edit mode
 * @returns Entity operations with toast notifications
 */
export function useEntityActions(
  projectId: string,
  currentProject: ProjectDetail | null | undefined,
  callbacks: {
    onOpenEditModal: (entity: Entity) => void;
  }
) {
  const createEntity = useCreateEntity(projectId);
  const updateEntity = useUpdateEntity(projectId);
  const deleteEntity = useDeleteEntity(projectId);
  const createRelationship = useCreateRelationship(projectId);
  const { toast } = useToast();

  const handleCreate = async (entity: InsertEntity) => {
    if (!projectId) {
      return;
    }

    try {
      await createEntity.mutateAsync(entity);
      toast({ title: 'Entity created successfully' });
    } catch (error) {
      toast({
        title: 'Failed to create entity',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (entityId: string, updates: Partial<Entity>) => {
    if (!projectId) {
      return;
    }

    try {
      await updateEntity.mutateAsync({ entityId, updates });
    } catch (error) {
      toast({
        title: 'Failed to update entity',
        variant: 'destructive',
      });
    }
  };

  /**
   * Updates the entity position using mutateAsync to ensure the caller (GraphView)
   * can wait for persistence before cleaning up the optimistic state.
   */
  const handleUpdatePosition = async (entityId: string, position: { x: number; y: number }) => {
    if (!projectId) {
      return;
    }

    try {
      await updateEntity.mutateAsync({ entityId, updates: { position } });
    } catch (error) {
      console.error(`Failed to persist position for entity ${entityId}:`, error);
      throw error;
    }
  };

  const handleDelete = async (entityId: string) => {
    if (!projectId) {
      return;
    }

    // NOTE: We are intentionally not using a modal confirmation
    // to align with the provided codebase's use of `confirm`.
    // This can be upgraded to a shadcn/ui Dialog later.
    if (confirm('Delete this entity? This cannot be undone.')) {
      try {
        await deleteEntity.mutateAsync(entityId);
        toast({ title: 'Entity deleted' });
      } catch (error) {
        toast({
          title: 'Failed to delete entity',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEntityDoubleClick = (entityId: string) => {
    const entity = currentProject?.entities.find((e) => e.id === entityId);
    if (entity) {
      callbacks.onOpenEditModal(entity);
    }
  };

  const generateDLO = async (dataStreamId: string) => {
    if (!currentProject) {
      return;
    }

    const dataStream = currentProject.entities.find((e) => e.id === dataStreamId);
    if (!dataStream || dataStream.type !== 'data-stream') {
      return;
    }

    try {
      const dloEntity: InsertEntity = {
        name: dataStream.name.replace('Stream', 'DLO'),
        type: 'dlo',
        fields: dataStream.fields.map((f) => ({
          ...f,
          id: crypto.randomUUID(),
        })),
        sourceDataStreamId: dataStreamId,
        position: {
          x: dataStream.position?.x || 0,
          y: (dataStream.position?.y || 0) + 240,
        },
      };

      const newDLO = await createEntity.mutateAsync(dloEntity);

      await createRelationship.mutateAsync({
        type: 'feeds-into',
        sourceEntityId: dataStreamId,
        targetEntityId: newDLO.id,
        label: 'Ingests',
      });

      toast({ title: 'DLO generated successfully' });
    } catch (error) {
      toast({
        title: 'Failed to generate DLO',
        variant: 'destructive',
      });
    }
  };

  const generateDMO = async (dloId: string) => {
    if (!currentProject) {
      return;
    }

    const dlo = currentProject.entities.find((e) => e.id === dloId);
    if (!dlo || dlo.type !== 'dlo') {
      return;
    }

    try {
      const dmoEntity: InsertEntity = {
        name: dlo.name.replace('DLO', 'DMO'),
        type: 'dmo',
        fields: dlo.fields.map((f) => ({
          ...f,
          id: crypto.randomUUID(),
        })),
        sourceDLOIds: [dloId],
        position: {
          x: dlo.position?.x || 0,
          y: (dlo.position?.y || 0) + 240,
        },
      };

      const newDMO = await createEntity.mutateAsync(dmoEntity);

      await createRelationship.mutateAsync({
        type: 'transforms-to',
        sourceEntityId: dloId,
        targetEntityId: newDMO.id,
      });

      toast({ title: 'DMO generated successfully' });
    } catch (error) {
      toast({
        title: 'Failed to generate DMO',
        variant: 'destructive',
      });
    }
  };

  return {
    handleCreate,
    handleUpdate,
    handleUpdatePosition,
    handleDelete,
    handleEntityDoubleClick,
    generateDLO,
    generateDMO,
    isCreating: createEntity.isPending,
    isUpdating: updateEntity.isPending,
    isDeleting: deleteEntity.isPending,
  };
}
