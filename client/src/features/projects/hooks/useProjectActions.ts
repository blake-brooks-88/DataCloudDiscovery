import { useToast } from "@/hooks/use-toast";
import {
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
} from '@/lib/storage';
import type { Project, InsertProject } from '@shared/schema';

/**
 * Project management operations.
 * Handles CRUD operations, import/export, and user feedback.
 * 
 * @param {object} callbacks - UI state callbacks
 * @param {function} callbacks.onProjectCreated - Callback after project creation
 * @param {function} callbacks.onProjectDeleted - Callback after project deletion
 * @returns Project operations with toast notifications
 */
export function useProjectActions(callbacks: {
    onProjectCreated: (projectId: string) => void;
    onProjectDeleted: () => void;
}) {
    const createProject = useCreateProject();
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();
    const { toast } = useToast();

    const handleCreate = async (data: { name: string; clientName?: string; consultant?: string }) => {
        try {
            const insertProject: InsertProject = {
                ...data,
                entities: [],
                dataSources: [],
                relationships: []
            };
            const newProject = await createProject.mutateAsync(insertProject);
            callbacks.onProjectCreated(newProject.id);
            toast({ title: 'Project created successfully' });
        } catch (error) {
            toast({
                title: 'Failed to create project',
                variant: 'destructive',
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    const handleRename = (project: Project) => {
        if (!project) return;
        const newName = prompt('Enter new project name:', project.name);
        if (newName && newName !== project.name) {
            updateProject.mutate({
                id: project.id,
                updates: { name: newName }
            });
        }
    };

    const handleDelete = async (project: Project) => {
        if (!project) return;
        if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
            try {
                await deleteProject.mutateAsync(project.id);
                callbacks.onProjectDeleted();
                toast({ title: 'Project deleted' });
            } catch (error) {
                toast({
                    title: 'Failed to delete project',
                    variant: 'destructive'
                });
            }
        }
    };

    const handleExportJSON = (project: Project) => {
        if (!project) return;
        const dataStr = JSON.stringify(project, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importedProject = JSON.parse(text) as InsertProject;
                const newProject = await createProject.mutateAsync(importedProject);
                callbacks.onProjectCreated(newProject.id);
                toast({ title: 'Project imported successfully' });
            } catch (error) {
                toast({
                    title: 'Failed to import project',
                    variant: 'destructive'
                });
            }
        };
        input.click();
    };

    const handleExportERD = () => toast({ title: 'ERD export coming soon' });

    const handleExportDataDictionary = () => toast({ title: 'Data dictionary export coming soon' });

    const handleImportCSV = () => toast({ title: 'CSV import coming soon' });

    return {
        handleCreate,
        handleRename,
        handleDelete,
        handleExportJSON,
        handleImportJSON,
        handleExportERD,
        handleExportDataDictionary,
        handleImportCSV,
        isCreating: createProject.isPending,
        isUpdating: updateProject.isPending,
        isDeleting: deleteProject.isPending,
    };
}