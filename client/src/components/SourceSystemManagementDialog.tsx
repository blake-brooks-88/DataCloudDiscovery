import { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import SourceSystemDialog from "./SourceSystemDialog";
import type { SourceSystem, SourceSystemType } from "@shared/schema";

interface SourceSystemManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceSystems: SourceSystem[];
  onCreateSourceSystem: () => void;
  onEditSourceSystem: (sourceSystem: SourceSystem) => void;
  onDeleteSourceSystem: (sourceSystemId: string) => void;
}

const sourceSystemTypeLabels: Record<SourceSystemType, string> = {
  salesforce: 'Salesforce',
  database: 'Database',
  api: 'API',
  csv: 'CSV',
  erp: 'ERP',
  marketing_tool: 'Marketing Tool',
  custom: 'Custom',
};

const sourceTypeColors: Record<SourceSystemType, string> = {
  salesforce: 'bg-info-50 text-info-700 border-info-500',
  database: 'bg-secondary-50 text-secondary-700 border-secondary-500',
  api: 'bg-tertiary-50 text-tertiary-700 border-tertiary-500',
  csv: 'bg-warning-50 text-warning-700 border-warning-500',
  erp: 'bg-primary-50 text-primary-700 border-primary-500',
  marketing_tool: 'bg-success-50 text-success-700 border-success-500',
  custom: 'bg-coolgray-100 text-coolgray-700 border-coolgray-400',
};

export default function SourceSystemManagementDialog({
  isOpen,
  onClose,
  sourceSystems,
  onCreateSourceSystem,
  onEditSourceSystem,
  onDeleteSourceSystem,
}: SourceSystemManagementDialogProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-manage-source-systems">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-coolgray-600">Manage Source Systems</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-coolgray-500">
                {sourceSystems.length} source {sourceSystems.length === 1 ? 'system' : 'systems'}
              </p>
              <Button
                onClick={onCreateSourceSystem}
                className="bg-primary-500 hover:bg-primary-600 text-white"
                data-testid="button-add-source-system"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Source System
              </Button>
            </div>

            {sourceSystems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-coolgray-200 rounded-lg">
                <p className="text-coolgray-400 mb-4">No source systems yet</p>
                <Button
                  onClick={onCreateSourceSystem}
                  variant="outline"
                  className="border-primary-500 text-primary-500 hover:bg-primary-50"
                  data-testid="button-add-first-source-system"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first source system
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sourceSystems.map((sourceSystem) => (
                  <div
                    key={sourceSystem.id}
                    className="flex items-center justify-between p-4 border border-coolgray-200 rounded-lg hover:bg-coolgray-50 transition-colors"
                    data-testid={`source-system-item-${sourceSystem.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-coolgray-600" data-testid={`source-system-name-${sourceSystem.id}`}>
                          {sourceSystem.name}
                        </h3>
                        <Badge className={`text-xs px-2 py-0.5 rounded-full border ${sourceTypeColors[sourceSystem.type]}`}>
                          {sourceSystemTypeLabels[sourceSystem.type]}
                        </Badge>
                      </div>
                      {sourceSystem.connectionDetails && (
                        <p className="text-sm text-coolgray-500 font-mono">
                          {sourceSystem.connectionDetails}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditSourceSystem(sourceSystem)}
                        className="border-secondary-500 text-secondary-500 hover:bg-secondary-50"
                        data-testid={`button-edit-source-${sourceSystem.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(sourceSystem.id)}
                        className="border-danger-500 text-danger-500 hover:bg-danger-50"
                        data-testid={`button-delete-source-${sourceSystem.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source System</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this source system? This action cannot be undone.
              Any entities using this source system will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-source">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteSourceSystem(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-danger-500 hover:bg-danger-600"
              data-testid="button-confirm-delete-source"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
