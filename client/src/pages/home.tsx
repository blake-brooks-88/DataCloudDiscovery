import { useProjects, useProject } from '@/lib/storage';
import {
  GraphView,
  ListView,
  EntityModal,
  useEntityActions,
  useEntityViewState,
} from '@/features/entities';

import { Navbar, Toolbar, ProjectDialog, useProjectActions } from '@/features/projects';

import { DataSourceManager, useDataSourceActions } from '@/features/data-sources';

import { RelationshipBuilder, useRelationshipActions } from '@/features/relationships';

import { Plus } from 'lucide-react';

import { useState, useEffect } from 'react';
import type { InsertDataSource, InsertEntity } from '@shared/schema';

export default function Home() {
  const { data: projects = [], isLoading } = useProjects();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isDataSourceManagerOpen, setIsDataSourceManagerOpen] = useState(false);
  const [isRelationshipBuilderOpen, setIsRelationshipBuilderOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<
    import('@shared/schema').Relationship | null
  >(null);
  const dataSourceActions = useDataSourceActions(currentProjectId || '');
  const relationshipActions = useRelationshipActions(currentProjectId || '');

  const { data: currentProject } = useProject(currentProjectId);

  const viewState = useEntityViewState();

  const projectActions = useProjectActions({
    onProjectCreated: (projectId) => {
      setCurrentProjectId(projectId);
      setIsProjectDialogOpen(false);
    },
    onProjectDeleted: () => {
      setCurrentProjectId(null);
    },
  });

  const entityActions = useEntityActions(currentProjectId || '', currentProject || null, {
    onOpenEditModal: viewState.openEditModal, // Pass the callback
  });

  useEffect(() => {
    const firstProject = projects[0];

    if (!currentProjectId && firstProject) {
      setCurrentProjectId(firstProject.id);
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
              <h2 className="text-[24px] font-bold text-coolgray-600 mb-4">No Project Selected</h2>
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
                entities={currentProject.entities || []}
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
                entities={currentProject.entities || []}
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
          onCreateDataSource={(dataSource) => {
            // Type assertion since EntityModal should only pass valid complete data sources
            dataSourceActions.handleCreate(dataSource as InsertDataSource);
          }}
        />
      )}

      {isDataSourceManagerOpen && currentProject && (
        <DataSourceManager
          isOpen={isDataSourceManagerOpen}
          onClose={() => setIsDataSourceManagerOpen(false)}
          dataSources={currentProject.dataSources || []}
          onCreateDataSource={dataSourceActions.handleCreate}
          onUpdateDataSource={dataSourceActions.handleUpdate}
          onDeleteDataSource={dataSourceActions.handleDelete}
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
        onSaveRelationship={relationshipActions.handleCreate}
        onDeleteRelationship={relationshipActions.handleDelete}
      />
    </div>
  );
}
