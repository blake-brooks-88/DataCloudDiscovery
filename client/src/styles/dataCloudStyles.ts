import type { EntityType, RelationshipType } from "@shared/schema";

export interface EntityCardStyle {
  background: string;
  borderColor: string;
  icon: string;
  badge: {
    text: string;
    // Use 'default' to map to primary, 'secondary' for secondary, etc.
    // 'neutral' will map to a coolgray outline badge.
    color: 'default' | 'secondary' | 'tertiary' | 'neutral';
  };
}

export interface RelationshipLineStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  animated?: boolean;
  label: string;
}

export function getEntityCardStyle(type: EntityType): EntityCardStyle {
  const styles: Record<EntityType, EntityCardStyle> = {
    'data-source': {
      background: '#F8FAFC', // coolgray-50
      borderColor: '#94A3B8', // coolgray-400
      icon: 'Database',
      badge: { text: 'Data Source', color: 'neutral' },
    },
    'data-stream': {
      background: '#E6F3FB', // secondary-50
      borderColor: '#4AA0D9', // secondary-500
      icon: 'Waves',
      badge: { text: 'Data Stream', color: 'secondary' },
    },
    'dlo': {
      background: '#F9FCEA', // tertiary-50
      borderColor: '#BED163', // tertiary-500
      icon: 'Cylinder',
      badge: { text: 'DLO', color: 'tertiary' },
    },
    'dmo': {
      background: '#FFF6EB', // primary-50
      borderColor: '#E49A43', // primary-500
      icon: 'Layers',
      badge: { text: 'DMO', color: 'default' }, // 'default' maps to primary
    },
    'data-transform': {
      // MODIFIED: Mapped to coolgray palette as 'violet' does not exist in the new theme
      background: '#F8FAFC', // coolgray-50
      borderColor: '#94A3B8', // coolgray-400
      icon: 'Sparkles',
      badge: { text: 'Transform', color: 'neutral' },
    },
  };

  // Ensure a fallback for any unexpected types
  return styles[type] || styles['data-source'];
}

export function getRelationshipLineStyle(type: RelationshipType): RelationshipLineStyle {
  const styles: Record<RelationshipType, RelationshipLineStyle> = {
    'feeds-into': {
      stroke: '#4AA0D9', // secondary-500
      strokeWidth: 3,
      strokeDasharray: 'none',
      animated: true,
      label: 'Ingests',
    },
    'transforms-to': {
      stroke: '#BED163', // tertiary-500
      strokeWidth: 3,
      strokeDasharray: '8,4',
      animated: false,
      label: 'Transforms',
    },
    'references': {
      stroke: '#64748B', // coolgray-500
      strokeWidth: 2,
      strokeDasharray: 'none',
      animated: false,
      label: 'FK',
    },
  };

  return styles[type];
}

export function getEntityTypeLabel(type: EntityType): string {
  const labels: Record<EntityType, string> = {
    'data-source': 'Data Source',
    'data-stream': 'Data Stream',
    'dlo': 'Data Lake Object (DLO)',
    'dmo': 'Data Model Object (DMO)',
    'data-transform': 'Data Transform',
  };

  return labels[type];
}

export function getRelationshipTypeLabel(type: RelationshipType): string {
  const labels: Record<RelationshipType, string> = {
    'feeds-into': 'Feeds Into (Ingests)',
    'transforms-to': 'Transforms To',
    'references': 'References (FK)',
  };

  return labels[type];
}
