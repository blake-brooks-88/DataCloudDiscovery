import { LayoutGrid, Table, Search, Database, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FieldType } from "@shared/schema";

type ViewMode = 'graph' | 'table';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: FieldType | 'all';
  onTypeFilterChange: (type: FieldType | 'all') => void;
  onOpenDataSources?: () => void;
  onOpenRelationships?: () => void;
}

export default function Toolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onOpenDataSources,
  onOpenRelationships,
}: ToolbarProps) {
  return (
    <div className="bg-white border-b border-coolgray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex bg-coolgray-100 rounded-xl p-1">
            <Button
              variant={viewMode === 'graph' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('graph')}
              className={viewMode === 'graph'
                ? "bg-secondary-500 text-white hover:bg-secondary-600"
                : "text-coolgray-600 hover:bg-coolgray-200"}
              data-testid="button-view-graph"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Graph View
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('table')}
              className={viewMode === 'table'
                ? "bg-secondary-500 text-white hover:bg-secondary-600"
                : "text-coolgray-600 hover:bg-coolgray-200"}
              data-testid="button-view-table"
            >
              <Table className="h-4 w-4 mr-2" />
              Table View
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-[768px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-[50%] transform -translate-y-[50%] h-4 w-4 text-coolgray-400" />
            <Input
              type="text"
              placeholder="Search entities or fields..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-coolgray-200 focus:border-secondary-500 focus:ring-[1px] focus:ring-secondary-500"
              data-testid="input-search"
            />
          </div>

          {onOpenDataSources && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDataSources}
              className="border-coolgray-200 text-coolgray-600 hover:bg-coolgray-100"
              data-testid="button-open-data-sources"
            >
              <Database className="h-4 w-4 mr-2" />
              Data Sources
            </Button>
          )}

          {onOpenRelationships && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenRelationships}
              className="border-coolgray-200 text-coolgray-600 hover:bg-coolgray-100"
              data-testid="button-open-relationships"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Relationships
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
