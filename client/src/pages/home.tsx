import { useProjects, useProject } from '../lib/storage';
import { EntityModal, useEntityActions, useEntityViewState } from '../features/entities';
import {
  Navbar,
  ProjectDialog,
  useProjectActions,
  ProjectView, // Consolidated import
} from '../features/projects';
import { DataSourceManager, useDataSourceActions } from '../features/data-sources';
import { RelationshipBuilder, useRelationshipActions } from '../features/relationships';

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

  // Search state removed - now managed in ProjectView
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
    onOpenEditModal: viewState.openEditModal,
  });

  useEffect(() => {
    const firstProject = projects[0];

    // Sets the first project as the current project on load if none is selected
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
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={viewState.openCreateModal}
            // Apply Primary-Orange color and standard shadow/shape tokens
            className="bg-primary-500 text-white rounded-full w-[56px] h-[56px] shadow-lg hover:bg-primary-600 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      {!currentProject ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* Uses coolgray text as per style guide */}
            <h2 className="text-[24px] font-bold text-coolgray-600 mb-4">No Project Selected</h2>
            <button
              onClick={() => setIsProjectDialogOpen(true)}
              // Apply Primary-Orange color and standard shape tokens (rounded-xl is Radius-LG)
              className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
            >
              Create Your First Project
            </button>
          </div>
        </div>
      ) : (
        <ProjectView
          viewMode={viewState.viewMode}
          onViewModeChange={viewState.setViewMode}
          currentProject={currentProject}
          selectedEntityId={viewState.selectedEntityId}
          onSelectEntity={viewState.setSelectedEntityId}
          onUpdateEntityPosition={entityActions.handleUpdatePosition}
          // WRAPPER FIX: Extracts ID from the Entity object before calling the original ID-based handler.
          onEntityDoubleClick={(entity) => entityActions.handleEntityDoubleClick(entity.id)}
          onGenerateDLO={(entity) => entityActions.generateDLO(entity.id)}
          onGenerateDMO={(entity) => entityActions.generateDMO(entity.id)}
          onOpenDataSources={() => setIsDataSourceManagerOpen(true)}
          onOpenRelationships={() => setIsRelationshipBuilderOpen(true)}
        />
      )}

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
