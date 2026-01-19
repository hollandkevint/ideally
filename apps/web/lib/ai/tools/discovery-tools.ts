/**
 * Discovery Tools Implementation
 *
 * Phase 5: Dynamic Capability Discovery
 *
 * These tools enable Mary to discover what capabilities are available at runtime,
 * enabling emergent behavior where she can compose solutions for requests
 * that weren't explicitly built.
 */

import {
  listAvailablePathways,
  listPhaseActions,
  listActionsByType,
  listDocumentTypes,
  listDocumentTypesByCategory,
  listDocumentTypesForPhase,
} from '@/lib/bmad/capability-discovery';
import type {
  DiscoverPathwaysResult,
  DiscoverPhaseActionsResult,
  DiscoverDocumentTypesResult,
  DiscoverPhaseActionsInput,
  DiscoverDocumentTypesInput,
} from './index';

// =============================================================================
// Tool Implementations
// =============================================================================

/**
 * Discover all available strategic pathways.
 * Used to understand what journeys are available for users.
 */
export async function discoverPathways(): Promise<DiscoverPathwaysResult> {
  try {
    const result = listAvailablePathways();

    return {
      success: true,
      data: {
        pathways: result.items.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          targetUser: p.targetUser,
          phases: p.phases,
        })),
        totalCount: result.totalCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error discovering pathways: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Discover what actions are available in a specific phase.
 * Can be filtered by phase and/or action type.
 */
export async function discoverPhaseActions(
  input: DiscoverPhaseActionsInput
): Promise<DiscoverPhaseActionsResult> {
  try {
    let result;

    if (input.action_type && input.phase_id) {
      // Filter by both phase and type
      result = listActionsByType(input.phase_id, input.action_type);
    } else if (input.phase_id) {
      // Filter by phase only
      result = listPhaseActions(input.phase_id);
    } else if (input.action_type) {
      // For type-only filter, we need to get all phases and filter
      // For simplicity, return universal actions filtered by type
      const allActions = listPhaseActions('');
      result = {
        items: allActions.items.filter((a) => a.type === input.action_type),
        context: `${input.action_type} actions across all phases`,
        totalCount: 0,
      };
      result.totalCount = result.items.length;
    } else {
      // No filters - return universal actions
      result = listPhaseActions('');
    }

    return {
      success: true,
      data: {
        actions: result.items.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          type: a.type,
          producesOutput: a.producesOutput,
          outputType: a.outputType,
        })),
        totalCount: result.totalCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error discovering phase actions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Discover what document types are available for generation.
 * Can be filtered by category and/or phase.
 */
export async function discoverDocumentTypes(
  input: DiscoverDocumentTypesInput
): Promise<DiscoverDocumentTypesResult> {
  try {
    let result;

    if (input.category && input.phase_id) {
      // Filter by both - get by category then filter by phase
      const byCategory = listDocumentTypesByCategory(input.category);
      const byPhase = listDocumentTypesForPhase(input.phase_id);
      const phaseIds = new Set(byPhase.items.map((d) => d.id));
      result = {
        items: byCategory.items.filter((d) => phaseIds.has(d.id)),
        context: `${input.category} documents for ${input.phase_id} phase`,
        totalCount: 0,
      };
      result.totalCount = result.items.length;
    } else if (input.category) {
      // Filter by category only
      result = listDocumentTypesByCategory(input.category);
    } else if (input.phase_id) {
      // Filter by phase only
      result = listDocumentTypesForPhase(input.phase_id);
    } else {
      // No filters - return all document types
      result = listDocumentTypes();
    }

    return {
      success: true,
      data: {
        documentTypes: result.items.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          category: d.category,
          requiredContext: d.requiredContext,
          generatorAvailable: d.generatorAvailable,
        })),
        totalCount: result.totalCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error discovering document types: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
