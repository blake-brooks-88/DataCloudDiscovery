import Navbar from '../Navbar';
import type { Project } from '@shared/schema';

export default function NavbarExample() {
  const projects: Project[] = [
    {
      id: '1',
      name: 'Acme Corp Data Cloud',
      clientName: 'Acme Corporation',
      consultant: 'John Smith',
      createdAt: Date.now(),
      lastModified: Date.now(),
      entities: [],
    },
    {
      id: '2',
      name: 'TechStart Integration',
      clientName: 'TechStart Inc',
      createdAt: Date.now(),
      lastModified: Date.now(),
      entities: [],
    },
  ];

  return (
    <Navbar
      currentProject={projects[0]}
      projects={projects}
      onSelectProject={(id) => console.log('Select project:', id)}
      onCreateProject={() => console.log('Create project')}
      onRenameProject={() => console.log('Rename project')}
      onDeleteProject={() => console.log('Delete project')}
      onImportCSV={() => console.log('Import CSV')}
      onImportJSON={() => console.log('Import JSON')}
      onExportJSON={() => console.log('Export JSON')}
      onExportERD={() => console.log('Export ERD')}
      onExportDataDictionary={() => console.log('Export Data Dictionary')}
    />
  );
}
