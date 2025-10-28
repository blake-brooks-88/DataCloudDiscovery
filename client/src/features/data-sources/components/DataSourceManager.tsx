import { useState } from 'react';
import { Plus, Pencil, Trash2, Database } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DataSource, SourceSystemType } from '@shared/schema';

interface DataSourceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  dataSources: DataSource[];
  onCreateDataSource: (dataSource: Omit<DataSource, 'id'>) => void;
  onUpdateDataSource: (id: string, dataSource: Partial<DataSource>) => void;
  onDeleteDataSource: (id: string) => void;
}

export function DataSourceManager({
  isOpen,
  onClose,
  dataSources,
  onCreateDataSource,
  onUpdateDataSource,
  onDeleteDataSource,
}: DataSourceManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'salesforce' as SourceSystemType,
    description: '',
    environment: 'production' as 'production' | 'sandbox' | 'dev' | 'uat',
    contactPerson: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'salesforce',
      description: '',
      environment: 'production',
      contactPerson: '',
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    setIsEditing(true);
    resetForm();
  };

  const handleEdit = (dataSource: DataSource) => {
    setFormData({
      name: dataSource.name,
      type: dataSource.type,
      description: dataSource.description || '',
      environment: dataSource.environment || 'production',
      contactPerson: dataSource.contactPerson || '',
    });
    setEditingId(dataSource.id);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }

    if (editingId) {
      onUpdateDataSource(editingId, formData);
    } else {
      onCreateDataSource(formData);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteDataSource(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-coolgray-600">
              <Database className="h-5 w-5" />
              Data Source Manager
            </DialogTitle>
            <DialogDescription>
              Manage external data sources (Salesforce, databases, APIs, etc.)
            </DialogDescription>
          </DialogHeader>

          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleCreate}
                  className="bg-primary-500 hover:bg-primary-600"
                  data-testid="button-create-data-source"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Data Source
                </Button>
              </div>

              {dataSources.length === 0 ? (
                <div className="text-center py-12 text-coolgray-400">
                  <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No data sources yet</p>
                  <p className="text-sm mt-1">Click &quot;Add Data Source&quot; to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSources.map((ds) => (
                      <TableRow key={ds.id} data-testid={`row-data-source-${ds.id}`}>
                        <TableCell className="font-medium">{ds.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-700">
                            {ds.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-coolgray-500">
                            {ds.environment || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-coolgray-500">
                          {ds.description || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ds)}
                              data-testid={`button-edit-${ds.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(ds.id)}
                              className="text-red-500 hover:text-red-700"
                              data-testid={`button-delete-${ds.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ds-name">Name *</Label>
                  <Input
                    id="ds-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Salesforce Production"
                    data-testid="input-data-source-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ds-type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          type: value as SourceSystemType,
                        })
                      }
                    >
                      <SelectTrigger id="ds-type" data-testid="select-data-source-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salesforce">Salesforce</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                        <SelectItem value="erp">ERP System</SelectItem>
                        <SelectItem value="marketing-cloud">Marketing Cloud</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ds-environment">Environment</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          environment: value as typeof formData.environment,
                        })
                      }
                    >
                      <SelectTrigger id="ds-environment" data-testid="select-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="dev">Development</SelectItem>
                        <SelectItem value="uat">UAT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ds-contact">Contact Person</Label>
                  <Input
                    id="ds-contact"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: e.target.value,
                      })
                    }
                    placeholder="e.g., John Smith (IT Admin)"
                    data-testid="input-contact-person"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ds-description">Description</Label>
                  <Textarea
                    id="ds-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add notes about this data source..."
                    rows={3}
                    data-testid="textarea-description"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={resetForm} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="bg-primary-500 hover:bg-primary-600"
                  data-testid="button-save-data-source"
                >
                  {editingId ? 'Update' : 'Create'} Data Source
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the data source. Entities linked to this source will need to be
              reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
