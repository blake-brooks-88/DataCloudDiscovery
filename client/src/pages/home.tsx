import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Toolbar from "@/components/Toolbar";
import GraphView from "@/components/GraphView";
import ListView from "@/components/ListView";
import EntityModal from "@/components/EntityModal";
import ProjectDialog from "@/components/ProjectDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Project, Entity, FieldType, Relationship } from "@shared/schema";

type ViewMode = 'graph' | 'table';

export default function Home() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FieldType | 'all'>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<'create' | 'rename'>('create');
  
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);

  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  useEffect(() => {
    const stored = localStorage.getItem('schema-builder-projects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migratedProjects = parsed.map((project: any) => {
          const relationships: Relationship[] = [];
          
          const migratedProject = {
            ...project,
            dataSources: project.dataSources || [],
            relationships: project.relationships || [],
            entities: (project.entities || []).map((entity: any) => {
              let dataSource = entity.dataSource;
              
              if (!dataSource && entity.sourceSystemId && project.sourceSystems) {
                const sourceSystem = project.sourceSystems.find((s: any) => s.id === entity.sourceSystemId);
                if (sourceSystem) {
                  dataSource = `${sourceSystem.name} (${sourceSystem.type})`;
                }
              }
              
              if (!dataSource && entity.sourceSystem) {
                dataSource = entity.sourceSystem.name || entity.sourceSystem.type || '';
              }
              
              // Extract relationships from old FK references
              if (entity.fields) {
                entity.fields.forEach((field: any) => {
                  if (field.isFK && field.fkReference && !project.relationships) {
                    relationships.push({
                      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      type: 'references',
                      sourceEntityId: entity.id,
                      targetEntityId: field.fkReference.targetEntityId,
                      label: field.fkReference.relationshipLabel,
                      fieldMappings: [{
                        sourceFieldId: field.id,
                        targetFieldId: field.fkReference.targetFieldId,
                      }],
                    });
                  }
                });
              }
              
              const { sourceSystemId, sourceSystem, ...entityRest } = entity;
              return {
                ...entityRest,
                type: entity.type || 'dmo', // Default to DMO for existing entities
                ...(dataSource && { dataSource }),
              };
            }),
          };
          
          // Add extracted relationships if not already present
          if (relationships.length > 0 && !project.relationships) {
            migratedProject.relationships = relationships;
          }
          
          delete migratedProject.sourceSystems;
          return migratedProject;
        });
        
        setProjects(migratedProjects);
        localStorage.setItem('schema-builder-projects', JSON.stringify(migratedProjects));
        if (migratedProjects.length > 0) {
          setCurrentProjectId(migratedProjects[0].id);
        }
      } catch (e) {
        console.error('Failed to load projects:', e);
      }
    } else {
      const defaultProject: Project = {
        id: `project-${Date.now()}`,
        name: 'My First Project',
        createdAt: Date.now(),
        lastModified: Date.now(),
        dataSources: [],
        entities: [],
        relationships: [],
      };
      setProjects([defaultProject]);
      setCurrentProjectId(defaultProject.id);
      localStorage.setItem('schema-builder-projects', JSON.stringify([defaultProject]));
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('schema-builder-projects', JSON.stringify(updatedProjects));
  };

  const updateCurrentProject = (updates: Partial<Project>) => {
    if (!currentProject) return;
    const updated = { ...currentProject, ...updates, lastModified: Date.now() };
    const updatedProjects = projects.map(p => p.id === currentProject.id ? updated : p);
    saveProjects(updatedProjects);
  };

  const handleCreateProject = (data: { name: string; clientName?: string; consultant?: string }) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: data.name,
      clientName: data.clientName,
      consultant: data.consultant,
      createdAt: Date.now(),
      lastModified: Date.now(),
      dataSources: [],
      entities: [],
      relationships: [],
    };
    const updated = [...projects, newProject];
    saveProjects(updated);
    setCurrentProjectId(newProject.id);
    toast({
      title: "Project created",
      description: `${newProject.name} has been created successfully.`,
    });
  };

  const handleRenameProject = (data: { name: string; clientName?: string; consultant?: string }) => {
    if (!currentProject) return;
    updateCurrentProject(data);
    toast({
      title: "Project updated",
      description: `Project has been updated successfully.`,
    });
  };

  const handleDeleteProject = () => {
    if (!currentProject) return;
    const filtered = projects.filter(p => p.id !== currentProject.id);
    saveProjects(filtered);
    setCurrentProjectId(filtered.length > 0 ? filtered[0].id : null);
    setIsDeleteProjectDialogOpen(false);
    toast({
      title: "Project deleted",
      description: `${currentProject.name} has been deleted.`,
      variant: "destructive",
    });
  };

  const handleSaveEntity = (entityData: Partial<Entity>) => {
    if (!currentProject) return;

    if (entityData.id) {
      const updatedEntities = currentProject.entities.map(e =>
        e.id === entityData.id ? { ...e, ...entityData } as Entity : e
      );
      updateCurrentProject({ entities: updatedEntities });
      toast({
        title: "Entity updated",
        description: `${entityData.name} has been updated successfully.`,
      });
    } else {
      const newEntity: Entity = {
        id: `entity-${Date.now()}`,
        name: entityData.name!,
        type: entityData.type || 'dmo',
        fields: entityData.fields || [],
        dataSource: entityData.dataSource,
        businessPurpose: entityData.businessPurpose,
        dataCloudMetadata: entityData.dataCloudMetadata,
        position: {
          x: 100 + (currentProject.entities.length * 50),
          y: 100 + (currentProject.entities.length * 50),
        },
        implementationStatus: entityData.implementationStatus,
        implementationNotes: entityData.implementationNotes,
      };
      updateCurrentProject({ entities: [...currentProject.entities, newEntity] });
      toast({
        title: "Entity created",
        description: `${newEntity.name} has been created successfully.`,
      });
    }
    setIsEntityModalOpen(false);
    setEditingEntity(null);
  };

  const handleUpdateEntityPosition = (entityId: string, position: { x: number; y: number }) => {
    if (!currentProject) return;
    const updatedEntities = currentProject.entities.map(e =>
      e.id === entityId ? { ...e, position } : e
    );
    updateCurrentProject({ entities: updatedEntities });
  };

  const handleEntityDoubleClick = (entityId: string) => {
    const entity = currentProject?.entities.find(e => e.id === entityId);
    if (entity) {
      setEditingEntity(entity);
      setIsEntityModalOpen(true);
    }
  };

  const handleExportJSON = () => {
    if (!currentProject) return;
    const dataStr = JSON.stringify(currentProject, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${currentProject.name.replace(/\s+/g, '_')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({
      title: "Export successful",
      description: "Project exported as JSON.",
    });
  };

  const handleExportERD = () => {
    toast({
      title: "Export ERD",
      description: "ERD export feature coming soon!",
    });
  };

  const handleExportDataDictionary = () => {
    if (!currentProject) return;
    let csv = 'Entity,Field Name,Type,Business Name,Notes,Data Source,Data Cloud Type,Is PK,Is FK,Contains PII,Visible in ERD\n';
    currentProject.entities.forEach(entity => {
      entity.fields.forEach(field => {
        csv += `"${entity.name}","${field.name}","${field.type}","${field.businessName || ''}","${field.notes || ''}","${entity.dataSource || ''}","${entity.dataCloudIntent?.objectType || ''}",${field.isPK},${field.isFK},${field.containsPII || false},${field.visibleInERD !== false}\n`;
      });
    });
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const exportFileDefaultName = `${currentProject.name.replace(/\s+/g, '_')}_data_dictionary.csv`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({
      title: "Export successful",
      description: "Data dictionary exported as CSV.",
    });
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as Project;
          imported.id = `project-${Date.now()}`;
          imported.createdAt = Date.now();
          imported.lastModified = Date.now();
          const updated = [...projects, imported];
          saveProjects(updated);
          setCurrentProjectId(imported.id);
          toast({
            title: "Import successful",
            description: `${imported.name} has been imported.`,
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid project file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleImportCSV = () => {
    toast({
      title: "Import CSV",
      description: "CSV import feature coming soon!",
    });
  };

  const filteredEntities = currentProject?.entities.filter(entity => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesEntity = entity.name.toLowerCase().includes(query);
      const matchesField = entity.fields.some(f => f.name.toLowerCase().includes(query));
      if (!matchesEntity && !matchesField) return false;
    }
    return true;
  }) || [];

  return (
    <div className="h-screen flex flex-col bg-coolgray-50">
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onSelectProject={setCurrentProjectId}
        onCreateProject={() => {
          setProjectDialogMode('create');
          setIsProjectDialogOpen(true);
        }}
        onRenameProject={() => {
          setProjectDialogMode('rename');
          setIsProjectDialogOpen(true);
        }}
        onDeleteProject={() => setIsDeleteProjectDialogOpen(true)}
        onImportCSV={handleImportCSV}
        onImportJSON={handleImportJSON}
        onExportJSON={handleExportJSON}
        onExportERD={handleExportERD}
        onExportDataDictionary={handleExportDataDictionary}
      />

      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      <div className="flex-1 overflow-hidden">
        {viewMode === 'graph' ? (
          <GraphView
            entities={filteredEntities}
            selectedEntityId={selectedEntityId}
            searchQuery={searchQuery}
            onSelectEntity={setSelectedEntityId}
            onUpdateEntityPosition={handleUpdateEntityPosition}
            onEntityDoubleClick={handleEntityDoubleClick}
          />
        ) : (
          <ListView
            entities={filteredEntities}
            selectedEntityId={selectedEntityId}
            onEntityClick={handleEntityDoubleClick}
          />
        )}
      </div>

      {currentProject && (
        <Button
          onClick={() => {
            setEditingEntity(null);
            setIsEntityModalOpen(true);
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg"
          data-testid="button-add-entity"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <EntityModal
        isOpen={isEntityModalOpen}
        onClose={() => {
          setIsEntityModalOpen(false);
          setEditingEntity(null);
        }}
        entity={editingEntity}
        entities={currentProject?.entities || []}
        onSave={handleSaveEntity}
      />

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        project={projectDialogMode === 'rename' ? currentProject : null}
        onSave={projectDialogMode === 'create' ? handleCreateProject : handleRenameProject}
        title={projectDialogMode === 'create' ? 'Create New Project' : 'Rename Project'}
      />

      <AlertDialog open={isDeleteProjectDialogOpen} onOpenChange={setIsDeleteProjectDialogOpen}>
        <AlertDialogContent className="bg-white border-coolgray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-coolgray-600">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-coolgray-500">
              Are you sure you want to delete "{currentProject?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-coolgray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-danger-500 hover:bg-danger-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
