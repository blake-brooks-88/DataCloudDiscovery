import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@shared/schema";

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (data: { name: string; clientName?: string; consultant?: string }) => void;
  title: string;
}

export function ProjectDialog({ isOpen, onClose, project, onSave, title }: ProjectDialogProps) {
  const [name, setName] = useState(project?.name || "");
  const [clientName, setClientName] = useState(project?.clientName || "");
  const [consultant, setConsultant] = useState(project?.consultant || "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name, clientName, consultant });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-coolgray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-coolgray-600">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="project-name" className="text-sm font-medium text-coolgray-500">
              Project Name *
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corp Data Cloud Implementation"
              className="mt-1 border-coolgray-200 focus:border-secondary-500"
              data-testid="input-project-name"
            />
          </div>

          <div>
            <Label htmlFor="client-name" className="text-sm font-medium text-coolgray-500">
              Client Name
            </Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              className="mt-1 border-coolgray-200 focus:border-secondary-500"
              data-testid="input-client-name"
            />
          </div>

          <div>
            <Label htmlFor="consultant" className="text-sm font-medium text-coolgray-500">
              Consultant
            </Label>
            <Input
              id="consultant"
              value={consultant}
              onChange={(e) => setConsultant(e.target.value)}
              placeholder="e.g., John Smith"
              className="mt-1 border-coolgray-200 focus:border-secondary-500"
              data-testid="input-consultant"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-coolgray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-coolgray-200 text-coolgray-600"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-primary-500 hover:bg-primary-600 text-white"
            data-testid="button-save"
          >
            {project ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
