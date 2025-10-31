import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectActions } from '../useProjectActions';
import { useToast } from '@/hooks/use-toast';
import { useCreateProject, useUpdateProject, useDeleteProject } from '@/lib/storage';
import type { InsertProject, ProjectDetail } from '@shared/schema';

vi.mock('@/hooks/use-toast');
vi.mock('@/lib/storage');

describe('useProjectActions', () => {
  const mockToast = vi.fn();
  const mockOnProjectCreated = vi.fn();
  const mockOnProjectDeleted = vi.fn();
  const mockCreateProjectMutateAsync = vi.fn();
  const mockUpdateProjectMutate = vi.fn();
  const mockDeleteProjectMutateAsync = vi.fn();
  const originalConfirm = global.confirm;
  const originalPrompt = global.prompt;
  const originalCreateElement = document.createElement;
  let mockClick: Mock;
  let mockRevokeObjectURL: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as Mock).mockReturnValue({
      toast: mockToast,
    });
    (useCreateProject as Mock).mockReturnValue({
      mutateAsync: mockCreateProjectMutateAsync,
      isPending: false,
    });
    (useUpdateProject as Mock).mockReturnValue({
      mutate: mockUpdateProjectMutate,
      isPending: false,
    });
    (useDeleteProject as Mock).mockReturnValue({
      mutateAsync: mockDeleteProjectMutateAsync,
      isPending: false,
    });
    global.confirm = vi.fn(() => true);
    global.prompt = vi.fn(() => 'New Name');
    mockClick = vi.fn();
    mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    global.confirm = originalConfirm;
    global.prompt = originalPrompt;
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
  });

  function createMockProject(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
    return {
      id: 'project-123',
      name: 'Test Project',
      createdAt: Date.now(),
      lastModified: Date.now(),
      organizationId: 'org-123',
      entities: [],
      relationships: [],
      dataSources: [],
      ...overrides,
    };
  }

  describe('handleCreate', () => {
    it('should create project and show success toast', async () => {
      const projectData = {
        name: 'My New Project',
        clientName: 'Acme Corp',
        consultant: 'John Doe',
      };
      const createdProject = createMockProject({
        id: 'new-project-id',
        name: 'My New Project',
      });
      mockCreateProjectMutateAsync.mockResolvedValue(createdProject);
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleCreate(projectData);
      expect(mockCreateProjectMutateAsync).toHaveBeenCalledWith({
        name: 'My New Project',
        clientName: 'Acme Corp',
        consultant: 'John Doe',
        entities: [],
        dataSources: [],
        relationships: [],
      });
      expect(mockOnProjectCreated).toHaveBeenCalledWith('new-project-id');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Project created successfully',
      });
    });

    it('should create project with minimal data', async () => {
      const projectData = {
        name: 'Minimal Project',
      };
      const createdProject = createMockProject({
        id: 'minimal-id',
        name: 'Minimal Project',
      });
      mockCreateProjectMutateAsync.mockResolvedValue(createdProject);
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleCreate(projectData);
      expect(mockCreateProjectMutateAsync).toHaveBeenCalledWith({
        name: 'Minimal Project',
        entities: [],
        dataSources: [],
        relationships: [],
      });
      expect(mockOnProjectCreated).toHaveBeenCalledWith('minimal-id');
    });

    it('should show error toast with message when creation fails', async () => {
      const projectData = {
        name: 'Failed Project',
      };
      const error = new Error('Database connection failed');
      mockCreateProjectMutateAsync.mockRejectedValue(error);
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleCreate(projectData);
      expect(mockCreateProjectMutateAsync).toHaveBeenCalled();
      expect(mockOnProjectCreated).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to create project',
        variant: 'destructive',
        description: 'Database connection failed',
      });
    });

    it('should show error toast with generic message for non-Error failures', async () => {
      const projectData = {
        name: 'Failed Project',
      };
      mockCreateProjectMutateAsync.mockRejectedValue('String error');
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleCreate(projectData);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to create project',
        variant: 'destructive',
        description: 'Unknown error',
      });
    });
  });

  describe('handleRename', () => {
    it('should rename project when user provides new name', () => {
      const project = createMockProject({
        id: 'project-1',
        name: 'Old Name',
      });
      (global.prompt as Mock).mockReturnValue('New Name');
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleRename(project);
      expect(global.prompt).toHaveBeenCalledWith('Enter new project name:', 'Old Name');
      expect(mockUpdateProjectMutate).toHaveBeenCalledWith({
        id: 'project-1',
        updates: { name: 'New Name' },
      });
    });

    it('should not rename when user cancels prompt', () => {
      const project = createMockProject({
        name: 'Old Name',
      });
      (global.prompt as Mock).mockReturnValue(null);
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleRename(project);
      expect(global.prompt).toHaveBeenCalled();
      expect(mockUpdateProjectMutate).not.toHaveBeenCalled();
    });

    it('should not rename when name is unchanged', () => {
      const project = createMockProject({
        name: 'Same Name',
      });
      (global.prompt as Mock).mockReturnValue('Same Name');
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleRename(project);
      expect(global.prompt).toHaveBeenCalled();
      expect(mockUpdateProjectMutate).not.toHaveBeenCalled();
    });

    it('should not rename when name is empty string', () => {
      const project = createMockProject({
        name: 'Old Name',
      });
      (global.prompt as Mock).mockReturnValue('');
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleRename(project);
      expect(mockUpdateProjectMutate).not.toHaveBeenCalled();
    });

    it('should handle null project gracefully', () => {
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleRename(null as null);
      expect(global.prompt).not.toHaveBeenCalled();
      expect(mockUpdateProjectMutate).not.toHaveBeenCalled();
    });
  });

  describe('handleDelete', () => {
    it('should delete project when user confirms', async () => {
      const project = createMockProject({
        id: 'project-1',
        name: 'Project to Delete',
      });
      (global.confirm as Mock).mockReturnValue(true);
      mockDeleteProjectMutateAsync.mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleDelete(project);
      expect(global.confirm).toHaveBeenCalledWith(
        'Delete project "Project to Delete"? This cannot be undone.'
      );
      expect(mockDeleteProjectMutateAsync).toHaveBeenCalledWith('project-1');
      expect(mockOnProjectDeleted).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Project deleted',
      });
    });

    it('should not delete when user cancels confirmation', async () => {
      const project = createMockProject({
        name: 'Project to Keep',
      });
      (global.confirm as Mock).mockReturnValue(false);
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleDelete(project);
      expect(global.confirm).toHaveBeenCalled();
      expect(mockDeleteProjectMutateAsync).not.toHaveBeenCalled();
      expect(mockOnProjectDeleted).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should show error toast when deletion fails', async () => {
      const project = createMockProject({
        name: 'Project to Delete',
      });
      (global.confirm as Mock).mockReturnValue(true);
      mockDeleteProjectMutateAsync.mockRejectedValue(new Error('Delete failed'));
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleDelete(project);
      expect(mockDeleteProjectMutateAsync).toHaveBeenCalled();
      expect(mockOnProjectDeleted).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to delete project',
        variant: 'destructive',
      });
    });

    it('should handle null project gracefully', async () => {
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      await result.current.handleDelete(null as null);
      expect(global.confirm).not.toHaveBeenCalled();
      expect(mockDeleteProjectMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('handleExportJSON', () => {
    it('should export project as JSON file', () => {
      const project = createMockProject({
        name: 'Export Project',
        entities: [
          {
            id: 'entity-1',
            name: 'Customer',
            type: 'dmo',
            fields: [],
          },
        ],
      });
      const mockLink: Partial<HTMLAnchorElement> = {
        href: '',
        download: '',
        click: mockClick,
      };
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'a') {
          return mockLink as HTMLAnchorElement;
        }
        return originalCreateElement.call(document, tag);
      }) as typeof document.createElement;
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleExportJSON(project);
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe('Export Project.json');
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle project with special characters in name', () => {
      const project = createMockProject({
        name: 'Project / With \\ Special: Chars',
      });
      const mockLink: Partial<HTMLAnchorElement> = {
        href: '',
        download: '',
        click: mockClick,
      };
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'a') {
          return mockLink as HTMLAnchorElement;
        }
        return originalCreateElement.call(document, tag);
      }) as typeof document.createElement;
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleExportJSON(project);
      expect(mockLink.download).toBe('Project / With \\ Special: Chars.json');
    });

    it('should handle null project gracefully', () => {
      const createdElementSpy = vi.fn((tag: string) => originalCreateElement.call(document, tag));
      document.createElement = createdElementSpy as typeof document.createElement;
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleExportJSON(null as null);
      const calls = createdElementSpy.mock.calls;
      const linkCreated = calls.some((call) => call[0] === 'a');
      expect(linkCreated).toBe(false);
      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('handleImportJSON', () => {
    it('should import project from JSON file', async () => {
      const importedProjectData: InsertProject = {
        name: 'Imported Project',
        entities: [],
        dataSources: [],
        relationships: [],
      };
      const createdProject = createMockProject({
        id: 'imported-id',
        name: 'Imported Project',
      });
      const mockFile = {
        text: vi.fn().mockResolvedValue(JSON.stringify(importedProjectData)),
        name: 'project.json',
        type: 'application/json',
      } as unknown as File;
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((this: GlobalEventHandlers, ev: Event) => unknown) | null,
        click: mockClick,
        files: [mockFile] as unknown as FileList,
      } as unknown as HTMLInputElement;
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'input') {
          return mockInput;
        }
        return originalCreateElement.call(document, tag);
      }) as typeof document.createElement;
      mockCreateProjectMutateAsync.mockResolvedValue(createdProject);
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleImportJSON();
      expect(mockInput.type).toBe('file');
      expect(mockInput.accept).toBe('.json');
      expect(mockClick).toHaveBeenCalled();
      const changeEvent = { target: mockInput } as unknown as Event;
      await mockInput.onchange?.call(mockInput, changeEvent);
      await waitFor(() => {
        expect(mockCreateProjectMutateAsync).toHaveBeenCalledWith(importedProjectData);
        expect(mockOnProjectCreated).toHaveBeenCalledWith('imported-id');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Project imported successfully',
        });
      });
    });

    it('should handle import when no file selected', async () => {
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((this: GlobalEventHandlers, ev: Event) => unknown) | null,
        click: mockClick,
        files: [] as unknown as FileList,
      } as unknown as HTMLInputElement;
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'input') {
          return mockInput;
        }
        return originalCreateElement.call(document, tag);
      }) as typeof document.createElement;
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleImportJSON();
      const changeEvent = { target: mockInput } as unknown as Event;
      await mockInput.onchange?.call(mockInput, changeEvent);
      expect(mockCreateProjectMutateAsync).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should show error toast when import fails', async () => {
      const mockFile = {
        text: vi.fn().mockResolvedValue('invalid json'),
        name: 'project.json',
        type: 'application/json',
      } as unknown as File;
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((this: GlobalEventHandlers, ev: Event) => unknown) | null,
        click: mockClick,
        files: [mockFile] as unknown as FileList,
      } as unknown as HTMLInputElement;
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'input') {
          return mockInput;
        }
        return originalCreateElement.call(document, tag);
      }) as typeof document.createElement;
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleImportJSON();
      const changeEvent = { target: mockInput } as unknown as Event;
      await mockInput.onchange?.call(mockInput, changeEvent);
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to import project',
          variant: 'destructive',
        });
      });
    });
  });

  describe('placeholder export/import functions', () => {
    it('should show placeholder toast for ERD export', () => {
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleExportERD();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'ERD export coming soon',
      });
    });

    it('should show placeholder toast for data dictionary export', () => {
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleExportDataDictionary();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Data dictionary export coming soon',
      });
    });

    it('should show placeholder toast for CSV import', () => {
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      result.current.handleImportCSV();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'CSV import coming soon',
      });
    });
  });

  describe('loading states', () => {
    it('should expose isCreating state', () => {
      (useCreateProject as Mock).mockReturnValue({
        mutateAsync: mockCreateProjectMutateAsync,
        isPending: true,
      });
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      expect(result.current.isCreating).toBe(true);
    });

    it('should expose isUpdating state', () => {
      (useUpdateProject as Mock).mockReturnValue({
        mutate: mockUpdateProjectMutate,
        isPending: true,
      });
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      expect(result.current.isUpdating).toBe(true);
    });

    it('should expose isDeleting state', () => {
      (useDeleteProject as Mock).mockReturnValue({
        mutateAsync: mockDeleteProjectMutateAsync,
        isPending: true,
      });
      const { result } = renderHook(() =>
        useProjectActions({
          onProjectCreated: mockOnProjectCreated,
          onProjectDeleted: mockOnProjectDeleted,
        })
      );
      expect(result.current.isDeleting).toBe(true);
    });
  });
});
