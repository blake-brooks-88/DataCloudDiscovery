// Components (UI)
export { default as EntityModal } from './components/EntityModal';
export type { EntityModalProps } from './components/EntityModal';

export { default as EntityNode } from './components/EntityNode';
// EntityNodeProps export removed as component now uses React Flow's NodeProps<T>

export { default as GraphView } from './components/GraphView';
export { default as ListView } from './components/ListView';
export type { ListViewProps } from './components/ListView';

export { CanvasLegend } from './components/CanvasLegend';
export { SearchResultsPanel } from './components/SearchResultsPanel';
export { RelationshipLayer } from './components/RelationshipLayer';

// Hooks (Logic)
export { useEntityActions } from './hooks/useEntityActions';
export { useEntityViewState } from './hooks/useEntityViewState';
export type { ViewMode } from './hooks/useEntityViewState';

export { useSearchState } from './hooks/useSearchState';

export { useEntitySearch } from './hooks/useEntitySearch';
