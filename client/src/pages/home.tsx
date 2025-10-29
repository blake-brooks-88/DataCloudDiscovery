import { useProjects, useProject } from '../lib/storage';
import { EntityModal, useEntityActions, useEntityViewState } from '../features/entities';
import { Navbar, ProjectDialog, useProjectActions, ProjectView } from '../features/projects';
import { DataSourceManager, useDataSourceActions } from '../features/data-sources';
import { RelationshipBuilder, useRelationshipActions } from '../features/relationships';

import { Plus } from 'lucide-react';

import { useState, useEffect } from 'react';
import type { InsertDataSource, InsertEntity, Field, Relationship } from '@shared/schema';

export default function Home() {
  const { data: projects = [], isLoading } = useProjects();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isDataSourceManagerOpen, setIsDataSourceManagerOpen] = useState(false);
  const [isRelationshipBuilderOpen, setIsRelationshipBuilderOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);

  // This state will hold the entity ID when opening the builder from the modal
  const [prefilledEntityId, setPrefilledEntityId] = useState<string | undefined>();

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
    onOpenEditModal: viewState.openEditModal,
  });

  const handleUpdateField = (entityId: string, fieldId: string, updates: Partial<Field>) => {
    if (!currentProject) {
      return;
    }
    const entity = currentProject.entities.find((e) => e.id === entityId);
    if (!entity) {
      return;
    }
    const newFields = entity.fields.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    entityActions.handleUpdate(entityId, { fields: newFields });
  };

  useEffect(() => {
    const firstProject = projects[0];
    if (!currentProjectId && firstProject) {
      setCurrentProjectId(firstProject.id);
    }
  }, [projects, currentProjectId]);

  // Handler to open the RelationshipBuilder from the EntityModal
  const handleOpenRelationshipBuilder = (entityId?: string) => {
    setPrefilledEntityId(entityId);
    setIsRelationshipBuilderOpen(true);
    setEditingRelationship(null); // Ensure we're in "create" mode
  };

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
            className="bg-primary-500 text-white rounded-full w-[56px] h-[56px] shadow-lg hover:bg-primary-600 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      {!currentProject ? (
        <div className="flex-1 flex items-center justify-center">
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
        <ProjectView
          viewMode={viewState.viewMode}
          onViewModeChange={viewState.setViewMode}
          currentProject={currentProject}
          selectedEntityId={viewState.selectedEntityId}
          onSelectEntity={viewState.setSelectedEntityId}
          onUpdateEntityPosition={entityActions.handleUpdatePosition}
          onEntityDoubleClick={(entity) => entityActions.handleEntityDoubleClick(entity.id)}
          onGenerateDLO={(entity) => entityActions.generateDLO(entity.id)}
          onGenerateDMO={(entity) => entityActions.generateDMO(entity.id)}
          onOpenDataSources={() => setIsDataSourceManagerOpen(true)}
          // Update this to use the new handler
          onOpenRelationships={() => handleOpenRelationshipBuilder(undefined)}
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
          onUpdateField={handleUpdateField}
          onCreateDataSource={(dataSource) => {
            dataSourceActions.handleCreate(dataSource as InsertDataSource);
          }}
          // --- WIRE UP THE BUTTONS ---
          onOpenRelationshipBuilder={handleOpenRelationshipBuilder}
          onEditRelationship={(rel) => {
            setEditingRelationship(rel);
            setIsRelationshipBuilderOpen(true);
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

      {/* This component is now fully wired up */}
      {currentProject && (
        <RelationshipBuilder
          isOpen={isRelationshipBuilderOpen}
          onClose={() => {
            setIsRelationshipBuilderOpen(false);
            setEditingRelationship(null);
            setPrefilledEntityId(undefined); // Clear prefill on close
          }}
          entities={currentProject.entities || []}
          relationships={currentProject.relationships || []}
          editingRelationship={editingRelationship}
          // Use the prefilled ID from our new state
          prefilledSourceEntityId={editingRelationship ? undefined : prefilledEntityId}
          // --- PASS THE NEW ACTIONS ---
          onSaveRelationship={relationshipActions.handleCreate}
          onUpdateEntityField={handleUpdateField}
          onDeleteRelationship={relationshipActions.handleDelete}
        />
      )}
    </div>
  );
}
