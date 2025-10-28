import { useToast } from "@/hooks/use-toast";
import {
    useCreateRelationship,
    useDeleteRelationship,
} from '@/lib/storage';
import type { InsertRelationship } from '@shared/schema';

/**
 * Relationship management operations for the current project.
 * Handles creation and deletion with user feedback.
 * 
 * @param {string} projectId - Current project ID
 * @returns Relationship operations with toast notifications
 */
export function useRelationshipActions(projectId: string) {
    const createRelationship = useCreateRelationship(projectId);
    const deleteRelationship = useDeleteRelationship(projectId);
    const { toast } = useToast();

    const handleCreate = async (relationship: InsertRelationship) => {
        if (!projectId) return;

        try {
            await createRelationship.mutateAsync(relationship);
            toast({ title: 'Relationship created' });
        } catch (error) {
            toast({
                title: 'Failed to create relationship',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (relationshipId: string) => {
        if (!projectId) return;

        try {
            await deleteRelationship.mutateAsync(relationshipId);
            toast({ title: 'Relationship deleted' });
        } catch (error) {
            toast({
                title: 'Failed to delete relationship',
                variant: 'destructive'
            });
        }
    };

    return {
        handleCreate,
        handleDelete,
        isCreating: createRelationship.isPending,
        isDeleting: deleteRelationship.isPending,
    };
}