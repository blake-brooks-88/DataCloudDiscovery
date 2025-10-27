import type { EntityType, RelationshipType } from "@shared/schema";

export interface EntityCardStyle {
  background: string;
  borderColor: string;
  icon: string;
  badge: {
    text: string;
    color: 'primary' | 'secondary' | 'tertiary' | 'neutral';
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
      background: '#F8FAFC',
      borderColor: '#94A3B8',
      icon: 'Database',
      badge: { text: 'Data Source', color: 'neutral' },
    },
    'data-stream': {
      background: '#E6F3FB',
      borderColor: '#4AA0D9',
      icon: 'Waves',
      badge: { text: 'Data Stream', color: 'secondary' },
    },
    'dlo': {
      background: '#F9FCEA',
      borderColor: '#BED163',
      icon: 'Cylinder',
      badge: { text: 'DLO', color: 'tertiary' },
    },
    'dmo': {
      background: '#FFF6EB',
      borderColor: '#E49A43',
      icon: 'Layers',
      badge: { text: 'DMO', color: 'primary' },
    },
    'data-transform': {
      background: '#F5F3FF',
      borderColor: '#A78BFA',
      icon: 'Sparkles',
      badge: { text: 'Transform', color: 'neutral' },
    },
  };

  return styles[type];
}

export function getRelationshipLineStyle(type: RelationshipType): RelationshipLineStyle {
  const styles: Record<RelationshipType, RelationshipLineStyle> = {
    'feeds-into': {
      stroke: '#4AA0D9',
      strokeWidth: 3,
      strokeDasharray: 'none',
      animated: true,
      label: 'Ingests',
    },
    'transforms-to': {
      stroke: '#BED163',
      strokeWidth: 3,
      strokeDasharray: '8,4',
      animated: false,
      label: 'Transforms',
    },
    'references': {
      stroke: '#64748B',
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
