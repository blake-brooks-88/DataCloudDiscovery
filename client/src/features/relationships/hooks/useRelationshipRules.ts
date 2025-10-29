import { useMemo } from 'react';
import type { Entity, Relationship, RelationshipType } from '@shared/schema';

/**
 * Determines the valid, *directional* relationship types between two entities.
 */
function getValidTypes(ent1?: Entity, ent2?: Entity): RelationshipType[] {
  if (!ent1 || !ent2) {
    return [];
  }

  const types: RelationshipType[] = [];
  const e1Type = ent1.type;
  const e2Type = ent2.type;

  // Rule 1: Data Stream -> DLO
  if (e1Type === 'data-stream' && e2Type === 'dlo') {
    types.push('feeds-into');
  }
  // Rule 2: DLO -> DMO
  if (e1Type === 'dlo' && e2Type === 'dmo') {
    types.push('transforms-to');
  }
  // Rule 3: DMO -> DMO
  if (e1Type === 'dmo' && e2Type === 'dmo') {
    types.push('references');
  }

  return types;
}

export interface RelationshipValidation {
  isValid: boolean;
  message: string | null;
  invalidType: RelationshipType | null;
}

/**
 * A hook to centralize all business logic and validation rules for creating relationships.
 *
 * @param {Entity[]} entities - All entities in the project.
 * @param {Relationship[]} relationships - All relationships in the project.
 * @param {string | undefined} entity1Id - The ID of the first selected entity (Source).
 * @param {string | undefined} entity2Id - The ID of the second selected entity (Target).
 * @returns An object containing allowed types and validation status.
 */
export function useRelationshipRules(
  entities: Entity[],
  relationships: Relationship[],
  entity1Id?: string,
  entity2Id?: string
) {
  const entity1 = useMemo(() => entities.find((e) => e.id === entity1Id), [entities, entity1Id]);
  const entity2 = useMemo(() => entities.find((e) => e.id === entity2Id), [entities, entity2Id]);

  // Create lookups for 1:1 constraints. This is efficient.
  const { dataStreamsWithFeeds, dlosWithFeeds, dmosWithTransforms } = useMemo(() => {
    const dataStreamsWithFeeds = new Set<string>();
    const dlosWithFeeds = new Set<string>();
    const dmosWithTransforms = new Set<string>();

    for (const rel of relationships) {
      if (rel.type === 'feeds-into') {
        dataStreamsWithFeeds.add(rel.sourceEntityId);
        dlosWithFeeds.add(rel.targetEntityId);
      }
      if (rel.type === 'transforms-to') {
        dmosWithTransforms.add(rel.targetEntityId);
      }
    }
    return { dataStreamsWithFeeds, dlosWithFeeds, dmosWithTransforms };
  }, [relationships]);

  // Determine allowed types based on entity selection
  const allowedRelationshipTypes = useMemo(
    () => getValidTypes(entity1, entity2),
    [entity1, entity2]
  );

  // Perform validation on the selected entities
  const validation = useMemo((): RelationshipValidation => {
    if (!entity1 || !entity2) {
      return { isValid: true, message: null, invalidType: null };
    }

    // --- Guard Rail 1: 'feeds-into' 1:1 Constraint ---
    if (allowedRelationshipTypes.includes('feeds-into')) {
      if (dataStreamsWithFeeds.has(entity1.id)) {
        return {
          isValid: false,
          message: `Data Stream '${entity1.name}' is already feeding another DLO.`,
          invalidType: 'feeds-into',
        };
      }
      if (dlosWithFeeds.has(entity2.id)) {
        return {
          isValid: false,
          message: `DLO '${entity2.name}' is already fed by another Data Stream.`,
          invalidType: 'feeds-into',
        };
      }
    }

    // --- Guard Rail 2: 'transforms-to' Shorthand Constraint ---
    if (allowedRelationshipTypes.includes('transforms-to')) {
      if (dmosWithTransforms.has(entity2.id)) {
        return {
          isValid: false,
          message: `DMO '${entity2.name}' is already the target of a 'Transforms To' relationship.`,
          invalidType: 'transforms-to',
        };
      }
      if (entity2.fieldMappings && entity2.fieldMappings.length > 0) {
        return {
          isValid: false,
          message: `DMO '${entity2.name}' already has detailed field mappings. A 'Transforms To' shorthand cannot be created.`,
          invalidType: 'transforms-to',
        };
      }
    }

    // All checks passed
    return { isValid: true, message: null, invalidType: null };
  }, [
    entity1,
    entity2,
    allowedRelationshipTypes,
    dataStreamsWithFeeds,
    dlosWithFeeds,
    dmosWithTransforms,
  ]);

  return {
    entity1,
    entity2,
    allowedRelationshipTypes,
    validation,
  };
}
