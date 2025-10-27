import { useState } from 'react';
import Toolbar from '../Toolbar';

export default function ToolbarExample() {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Toolbar
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      sourceFilter="all"
      onSourceFilterChange={(source) => console.log('Source filter:', source)}
      typeFilter="all"
      onTypeFilterChange={(type) => console.log('Type filter:', type)}
      flagFilter={null}
      onFlagFilterChange={(flag) => console.log('Flag filter:', flag)}
    />
  );
}
