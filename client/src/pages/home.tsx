import Navbar from "@/components/layout/Navbar";
import Toolbar from "@/components/layout/Toolbar";
import GraphView from "@/components/entities/GraphView";
import ListView from "@/components/entities/ListView";
import EntityModal from "@/components/entities/EntityModal";
import ProjectDialog from "@/components/layout/projects/ProjectDialog";
import DataSourceManager from "@/components/data-sources/DataSourceManager";
import RelationshipBuilder from "@/components/relationships/RelationshipBuilder";
import TableView from '@/components/entities/TableView';
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";


import { useState, useEffect } from 'react';
import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useCreateRelationship,
  useDeleteRelationship,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource
} from '@/lib/storage';
import type { Project, Entity, InsertProject, InsertEntity, DataSource, FieldType } from '@shared/schema';

type ViewMode = 'graph' | 'table';

export default function Home() {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FieldType | 'all'>('all');
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isDataSourceManagerOpen, setIsDataSourceManagerOpen] = useState(false);
  const [isRelationshipBuilderOpen, setIsRelationshipBuilderOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<import("@shared/schema").Relationship | null>(null);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  const { toast } = useToast();

  const { data: currentProject } = useProject(currentProjectId);

  const createEntity = useCreateEntity(currentProjectId || '');
  const updateEntity = useUpdateEntity(currentProjectId || '');
  const deleteEntity = useDeleteEntity(currentProjectId || '');
  const createRelationship = useCreateRelationship(currentProjectId || '');
  const deleteRelationship = useDeleteRelationship(currentProjectId || '');
  const createDataSource = useCreateDataSource(currentProjectId || '');
  const updateDataSource = useUpdateDataSource(currentProjectId || '');
  const deleteDataSource = useDeleteDataSource(currentProjectId || '');

  useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects, currentProjectId]);

  const handleCreateProject = async (data: { name: string; clientName?: string; consultant?: string }) => {
    try {
      const insertProject: InsertProject = {
        ...data,
        entities: [],
        dataSources: [],
        relationships: []
      };
      const newProject = await createProject.mutateAsync(insertProject);
      setCurrentProjectId(newProject.id);
      setIsProjectDialogOpen(false);
      toast({ title: 'Project created successfully' });
    } catch (error) {
      toast({
        title: 'Failed to create project',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleRenameProject = () => {
    if (!currentProject) return;
    const newName = prompt('Enter new project name:', currentProject.name);
    if (newName && newName !== currentProject.name) {
      updateProject.mutate({
        id: currentProject.id,
        updates: { name: newName }
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    if (confirm(`Delete project "${currentProject.name}"? This cannot be undone.`)) {
      try {
        await deleteProject.mutateAsync(currentProject.id);
        setCurrentProjectId(null);
        toast({ title: 'Project deleted' });
      } catch (error) {
        toast({
          title: 'Failed to delete project',
          variant: 'destructive'
        });
      }
    }
  };

  const handleCreateEntity = async (entity: InsertEntity) => {
    if (!currentProjectId) return;
    try {
      await createEntity.mutateAsync(entity);
      setIsEntityModalOpen(false);
      toast({ title: 'Entity created successfully' });
    } catch (error) {
      toast({
        title: 'Failed to create entity',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateEntity = async (entityId: string, updates: Partial<Entity>) => {
    if (!currentProjectId) return;
    try {
      await updateEntity.mutateAsync({ entityId, updates });
    } catch (error) {
      toast({
        title: 'Failed to update entity',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateEntityPosition = (entityId: string, position: { x: number; y: number }) => {
    updateEntity.mutate({ entityId, updates: { position } });
  };

  const handleEntityDoubleClick = (entityId: string) => {
    setEditingEntityId(entityId);
    setIsEntityModalOpen(true);
  };

  const handleDeleteEntity = async (entityId: string) => {
    if (!currentProjectId) return;
    if (confirm('Delete this entity? This cannot be undone.')) {
      try {
        await deleteEntity.mutateAsync(entityId);
        toast({ title: 'Entity deleted' });
      } catch (error) {
        toast({
          title: 'Failed to delete entity',
          variant: 'destructive'
        });
      }
    }
  };

  const handleGenerateDLO = async (dataStreamId: string) => {
    if (!currentProject) return;

    const dataStream = currentProject.entities.find(e => e.id === dataStreamId);
    if (!dataStream || dataStream.type !== 'data-stream') return;

    try {
      const dloEntity: InsertEntity = {
        name: dataStream.name.replace('Stream', 'DLO'),
        type: 'dlo',
        fields: dataStream.fields.map(f => ({
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
        variant: 'destructive'
      });
    }
  };

  const handleGenerateDMO = async (dloId: string) => {
    if (!currentProject) return;

    const dlo = currentProject.entities.find(e => e.id === dloId);
    if (!dlo || dlo.type !== 'dlo') return;

    try {
      const dmoEntity: InsertEntity = {
        name: dlo.name.replace('DLO', 'DMO'),
        type: 'dmo',
        fields: dlo.fields.map(f => ({
          ...f,
          id: crypto.randomUUID(),
        })),
        sourceDLOIds: [dloId],
        fieldMappings: dlo.fields.map(f => ({
          targetFieldId: crypto.randomUUID(),
          sourceEntityId: dloId,
          sourceFieldId: f.id,
        })),
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
        variant: 'destructive'
      });
    }
  };

  const handleExportJSON = () => {
    if (!currentProject) return;
    const dataStr = JSON.stringify(currentProject, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedProject = JSON.parse(text) as InsertProject;
        await createProject.mutateAsync(importedProject);
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

  // TODO: Implement ERD and data dictionary export
  const handleExportERD = () => toast({ title: 'ERD export coming soon' });
  const handleExportDataDictionary = () => toast({ title: 'Data dictionary export coming soon' });
  const handleImportCSV = () => toast({ title: 'CSV import coming soon' });

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
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onImportCSV={handleImportCSV}
        onImportJSON={handleImportJSON}
        onExportJSON={handleExportJSON}
        onExportERD={handleExportERD}
        onExportDataDictionary={handleExportDataDictionary}
      />

      {currentProject && (
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onOpenDataSources={() => setIsDataSourceManagerOpen(true)}
          onOpenRelationships={() => setIsRelationshipBuilderOpen(true)}
        />
      )}

      {currentProject && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              setEditingEntityId(null);
              setIsEntityModalOpen(true);
            }}
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
            {viewMode === 'graph' && (
              <GraphView
                entities={currentProject.entities}
                relationships={currentProject.relationships || []}
                selectedEntityId={selectedEntityId}
                searchQuery={searchQuery}
                onSelectEntity={setSelectedEntityId}
                onUpdateEntityPosition={handleUpdateEntityPosition}
                onEntityDoubleClick={handleEntityDoubleClick}
                onGenerateDLO={handleGenerateDLO}
                onGenerateDMO={handleGenerateDMO}
                onUpdateRelationshipWaypoints={() => {
                  // TODO: Implement waypoint persistence
                }}
              />
            )}

            {viewMode === 'table' && (
              <ListView
                entities={currentProject.entities}
                onEntityClick={setSelectedEntityId}
              />
            )}
          </>
        )}
      </div>

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onSave={(dialogData) => {
          const newProject: InsertProject = {
            ...dialogData,
            entities: [],
            relationships: [],
            dataSources: [],
          };

          handleCreateProject(newProject);
        }}
        project={null}
        title="Create New Project"
      />

      {isEntityModalOpen && currentProject && (
        <EntityModal
          isOpen={isEntityModalOpen}
          onClose={() => setIsEntityModalOpen(false)}  // Fix: was closing wrong modal
          entity={editingEntityId ? currentProject.entities.find(e => e.id === editingEntityId) || null : null}
          onSave={(data) => {
            if (editingEntityId) {
              handleUpdateEntity(editingEntityId, data);
            } else {
              handleCreateEntity(data as InsertEntity);
            }
            setIsEntityModalOpen(false);
            setEditingEntityId(null);
          }}
          // Remove onDelete - not supported
          entities={currentProject.entities || []}
          dataSources={currentProject.dataSources || []}
          relationships={currentProject.relationships || []}
          onCreateDataSource={async (dataSource) => {
            await createDataSource.mutateAsync(dataSource as any);  // Cast to bypass type checking
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
        prefilledSourceEntityId={editingRelationship ? undefined : editingEntity?.id}
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