import { useToast } from "@/hooks/use-toast";
import {
    useCreateDataSource,
    useUpdateDataSource,
    useDeleteDataSource,
} from '@/lib/storage';
import type { DataSource, InsertDataSource } from '@shared/schema';

/**
 * Data source management operations for the current project.
 * Handles CRUD operations with user feedback.
 * 
 * @param {string} projectId - Current project ID
 * @returns Data source operations with toast notifications
 */
export function useDataSourceActions(projectId: string) {
    const createDataSource = useCreateDataSource(projectId);
    const updateDataSource = useUpdateDataSource(projectId);
    const deleteDataSource = useDeleteDataSource(projectId);
    const { toast } = useToast();

    const handleCreate = async (dataSource: InsertDataSource) => {
        if (!projectId) return;

        try {
            await createDataSource.mutateAsync(dataSource);
            toast({ title: 'Data source created' });
        } catch (error) {
            toast({
                title: 'Failed to create data source',
                variant: 'destructive'
            });
        }
    };

    const handleUpdate = async (dataSourceId: string, updates: Partial<DataSource>) => {
        if (!projectId) return;

        try {
            await updateDataSource.mutateAsync({ dataSourceId, updates });
            toast({ title: 'Data source updated' });
        } catch (error) {
            toast({
                title: 'Failed to update data source',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (dataSourceId: string) => {
        if (!projectId) return;

        try {
            await deleteDataSource.mutateAsync(dataSourceId);
            toast({ title: 'Data source deleted' });
        } catch (error) {
            toast({
                title: 'Failed to delete data source',
                variant: 'destructive'
            });
        }
    };

    return {
        handleCreate,
        handleUpdate,
        handleDelete,
        isCreating: createDataSource.isPending,
        isUpdating: updateDataSource.isPending,
        isDeleting: deleteDataSource.isPending,
    };
}