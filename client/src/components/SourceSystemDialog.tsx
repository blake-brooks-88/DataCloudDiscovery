import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SourceSystem, SourceSystemType } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Source system name is required"),
  type: z.enum(['salesforce', 'database', 'api', 'csv', 'erp', 'marketing_tool', 'custom']),
  connectionDetails: z.string().optional(),
  color: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SourceSystemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceSystem: SourceSystem | null;
  onSave: (data: FormData) => void;
  title: string;
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

export default function SourceSystemDialog({ isOpen, onClose, sourceSystem, onSave, title }: SourceSystemDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "salesforce",
      connectionDetails: "",
      color: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: sourceSystem?.name || "",
        type: sourceSystem?.type || "salesforce",
        connectionDetails: sourceSystem?.connectionDetails || "",
        color: sourceSystem?.color || "",
      });
    }
  }, [isOpen, sourceSystem, form]);

  const handleSubmit = (data: FormData) => {
    onSave(data);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-coolgray-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-coolgray-900">{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-coolgray-700">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Salesforce Production"
                      className="border-coolgray-300"
                      data-testid="input-source-system-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-coolgray-700">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-coolgray-300" data-testid="select-source-system-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-coolgray-200">
                      {Object.entries(sourceSystemTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="connectionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-coolgray-700">Connection Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Instance URL, credentials, etc."
                      className="border-coolgray-300 min-h-[80px]"
                      data-testid="input-connection-details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-coolgray-300"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white"
                data-testid="button-save-source-system"
              >
                {sourceSystem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
