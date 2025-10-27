import { useState } from 'react';
import ProjectDialog from '../ProjectDialog';
import { Button } from '@/components/ui/button';

export default function ProjectDialogExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-primary-500 hover:bg-primary-600 text-white"
      >
        Open Project Dialog
      </Button>
      <ProjectDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        project={null}
        onSave={(data) => {
          console.log('Save project:', data);
          setIsOpen(false);
        }}
        title="Create New Project"
      />
    </div>
  );
}
