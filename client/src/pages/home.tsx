import { GraphView, ListView, EntityModal, useEntityActions, useEntityViewState } from "@/features/entities";
import Navbar from "@/features/projects/components/Navbar";
import Toolbar from "@/features/projects/components/Toolbar";
import ProjectDialog from "@/features/projects/components/ProjectDialog";
import {
  useProjects,
  useProject,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource,
  useCreateRelationship,
  useDeleteRelationship
} from '@/lib/storage';
import DataSourceManager from "@/features/data-sources/components/DataSourceManager";
import RelationshipBuilder from "@/features/relationships/components/RelationshipBuilder";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useProjectActions } from "@/features/projects/hooks/useProjectActions";


import { useState, useEffect } from 'react';
import type { Project, Entity, InsertProject, InsertEntity, DataSource, FieldType } from '@shared/schema';

export default function Home() {
  const { data: projects = [], isLoading } = useProjects();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isDataSourceManagerOpen, setIsDataSourceManagerOpen] = useState(false);
  const [isRelationshipBuilderOpen, setIsRelationshipBuilderOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<import("@shared/schema").Relationship | null>(null);
  const createDataSource = useCreateDataSource(currentProjectId || '');
  const updateDataSource = useUpdateDataSource(currentProjectId || '');
  const deleteDataSource = useDeleteDataSource(currentProjectId || '');
  const createRelationship = useCreateRelationship(currentProjectId || '');
  const deleteRelationship = useDeleteRelationship(currentProjectId || '');

  const { toast } = useToast();

  const { data: currentProject } = useProject(currentProjectId);

  const viewState = useEntityViewState();

  const projectActions = useProjectActions({
    onProjectCreated: (projectId) => {
      setCurrentProjectId(projectId);
      setIsProjectDialogOpen(false);
    },
    onProjectDeleted: () => {
      setCurrentProjectId(null);
    }
  });

  const entityActions = useEntityActions(
    currentProjectId || '',
    currentProject,
    {
      onOpenEditModal: viewState.openEditModal  // Pass the callback
    }
  );


  useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects, currentProjectId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-coolgray-50">
        <div className="text-coolgray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-coolgray-50">
      <Navbar
        currentProject={currentProject || null}
        projects={projects}
        onSelectProject={setCurrentProjectId}
        onCreateProject={() => setIsProjectDialogOpen(true)}
        onRenameProject={() => currentProject && projectActions.handleRename(currentProject)}
        onDeleteProject={() => currentProject && projectActions.handleDelete(currentProject)}
        onImportCSV={projectActions.handleImportCSV}
        onImportJSON={projectActions.handleImportJSON}
        onExportJSON={() => currentProject && projectActions.handleExportJSON(currentProject)}
        onExportERD={projectActions.handleExportERD}
        onExportDataDictionary={projectActions.handleExportDataDictionary}
      />

      {currentProject && (
        <Toolbar
          viewMode={viewState.viewMode}
          onViewModeChange={viewState.setViewMode}
          searchQuery={viewState.searchQuery}
          onSearchChange={viewState.setSearchQuery}
          typeFilter={viewState.typeFilter}
          onTypeFilterChange={viewState.setTypeFilter}
          onOpenDataSources={() => setIsDataSourceManagerOpen(true)}
          onOpenRelationships={() => setIsRelationshipBuilderOpen(true)}
        />
      )}

      {currentProject && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={viewState.openCreateModal}
            className="bg-primary-500 text-white rounded-full w-[56px] h-[56px] shadow-lg hover:bg-primary-600 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {!currentProject ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-[24px] font-bold text-coolgray-600 mb-4">
                No Project Selected
              </h2>
              <button
                onClick={() => setIsProjectDialogOpen(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewState.viewMode === 'graph' && (
              <GraphView
                entities={currentProject.entities}
                relationships={currentProject.relationships || []}
                selectedEntityId={viewState.selectedEntityId}
                searchQuery={viewState.searchQuery}
                onSelectEntity={viewState.setSelectedEntityId}
                onUpdateEntityPosition={entityActions.handleUpdatePosition}
                onEntityDoubleClick={entityActions.handleEntityDoubleClick}
                onGenerateDLO={entityActions.generateDLO}
                onGenerateDMO={entityActions.generateDMO}
                onUpdateRelationshipWaypoints={() => {
                  // TODO: Implement waypoint persistence
                }}
              />
            )}

            {viewState.viewMode === 'table' && (
              <ListView
                entities={currentProject.entities}
                onEntityClick={viewState.setSelectedEntityId}
              />
            )}
          </>
        )}
      </div>

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onSave={projectActions.handleCreate}
        project={null}
        title="Create New Project"
      />

      {viewState.isEntityModalOpen && currentProject && (
        <EntityModal
          isOpen={viewState.isEntityModalOpen}
          onClose={viewState.closeModal}
          entity={viewState.editingEntity}
          onSave={(data) => {
            if (viewState.editingEntity) {
              entityActions.handleUpdate(viewState.editingEntity.id, data);
            } else {
              entityActions.handleCreate(data as InsertEntity);
            }
            viewState.closeModal();
          }}
          entities={currentProject.entities || []}
          dataSources={currentProject.dataSources || []}
          relationships={currentProject.relationships || []}
          onCreateDataSource={async (dataSource) => {
            await createDataSource.mutateAsync(dataSource as any);
            toast({ title: 'Data source created' });
          }}
        />
      )}

      {isDataSourceManagerOpen && currentProject && (
        <DataSourceManager
          isOpen={isDataSourceManagerOpen}
          onClose={() => setIsDataSourceManagerOpen(false)}
          dataSources={currentProject.dataSources || []}
          onCreateDataSource={async (dataSource) => {
            await createDataSource.mutateAsync(dataSource);
            toast({ title: 'Data source created' });
          }}
          onUpdateDataSource={async (id, updates) => {
            await updateDataSource.mutateAsync({ dataSourceId: id, updates });
            toast({ title: 'Data source updated' });
          }}
          onDeleteDataSource={async (id) => {
            await deleteDataSource.mutateAsync(id);
            toast({ title: 'Data source deleted' });
          }}
        />
      )}
      <RelationshipBuilder
        isOpen={isRelationshipBuilderOpen}
        onClose={() => {
          setIsRelationshipBuilderOpen(false);
          setEditingRelationship(null);
        }}
        entities={currentProject?.entities || []}
        relationships={currentProject?.relationships || []}
        editingRelationship={editingRelationship}
        prefilledSourceEntityId={editingRelationship ? undefined : viewState.editingEntity?.id}
        onSaveRelationship={async (dataSource) => {
          await createRelationship.mutateAsync(dataSource);
          toast({ title: 'Data source created' });
        }}
        onDeleteRelationship={async (id) => {
          await deleteRelationship.mutateAsync(id);
          toast({ title: 'Data source deleted' });
        }}
      />
    </div>
  );
}