import {
  Database,
  Layers3,
  ChevronDown,
  FilePlus,
  Upload,
  Download,
  FileText,
  FileJson,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { ProjectDetail, ProjectSummary } from '@shared/schema';

interface NavbarProps {
  currentProject: ProjectDetail | null;
  projects: ProjectSummary[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
  onImportCSV: () => void;
  onImportJSON: () => void;
  onExportJSON: () => void;
  onExportERD: () => void;
  onExportDataDictionary: () => void;
}

/**
 * @component Navbar
 * @description The main application navigation bar. Handles project selection,
 * creation, deletion, and import/export operations.
 *
 * @param {NavbarProps} props - Component props
 * @returns {JSX.Element}
 */
export function Navbar({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onImportCSV,
  onImportJSON,
  onExportJSON,
  onExportERD,
  onExportDataDictionary,
}: NavbarProps) {
  return (
    <nav className="bg-coolgray-50 border-b border-border shadow-md sticky top-0 z-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Database className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Data Cloud Discovery</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-input text-foreground hover:bg-muted"
                data-testid="button-project-selector"
              >
                <Layers3 className="h-4 w-4 mr-2" />
                {currentProject?.name || 'Select Project'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border-border shadow-lg rounded-md">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={currentProject?.id === project.id ? 'bg-secondary-50' : ''}
                  data-testid={`menu-item-project-${project.id}`}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCreateProject} data-testid="menu-item-create-project">
                <FilePlus className="h-4 w-4 mr-2" />
                Create New Project
              </DropdownMenuItem>
              {currentProject && (
                <>
                  <DropdownMenuItem
                    onClick={onRenameProject}
                    data-testid="menu-item-rename-project"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Rename Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDeleteProject}
                    className="text-destructive"
                    data-testid="menu-item-delete-project"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary-50"
                data-testid="button-import"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border shadow-lg rounded-md">
              <DropdownMenuItem onClick={onImportCSV} data-testid="menu-item-import-csv">
                <FileText className="h-4 w-4 mr-2" />
                Import from CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImportJSON} data-testid="menu-item-import-json">
                <FileJson className="h-4 w-4 mr-2" />
                Import Project (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary-50 disabled:bg-coolgray-200 disabled:text-coolgray-400 disabled:border-coolgray-200"
                disabled={!currentProject}
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border shadow-lg rounded-md">
              <DropdownMenuItem onClick={onExportJSON} data-testid="menu-item-export-json">
                <FileJson className="h-4 w-4 mr-2" />
                Export Project (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportERD} data-testid="menu-item-export-erd">
                <FileText className="h-4 w-4 mr-2" />
                Export ERD (PNG)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportDataDictionary}
                data-testid="menu-item-export-dictionary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Data Dictionary (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
