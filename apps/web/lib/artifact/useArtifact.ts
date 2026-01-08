'use client';

/**
 * useArtifact Hook for ThinkHaven
 *
 * Provides operations for a single artifact, including view/render mode
 * toggling and export functionality.
 */

import { useCallback, useMemo } from 'react';
import { useArtifacts } from './artifact-store';
import {
  type Artifact,
  type ArtifactViewMode,
  type ArtifactRenderMode,
  type ExportFormat,
  ARTIFACT_CONFIGS,
  supportsRawView,
  isArtifactEditable,
  getExportFormats,
} from './artifact-types';

/**
 * Return type for useArtifact hook
 */
interface UseArtifactResult {
  // The artifact (undefined if not found)
  artifact: Artifact | undefined;

  // Computed properties
  isEditable: boolean;
  canToggleRaw: boolean;
  availableExportFormats: ExportFormat[];
  config: (typeof ARTIFACT_CONFIGS)[keyof typeof ARTIFACT_CONFIGS] | undefined;

  // Actions
  setViewMode: (mode: ArtifactViewMode) => void;
  setRenderMode: (mode: ArtifactRenderMode) => void;
  toggleViewMode: () => void;
  toggleRenderMode: () => void;
  updateContent: (content: string) => void;
  remove: () => void;

  // Export (returns blob URL or triggers download)
  exportArtifact: (format: ExportFormat) => Promise<string | void>;
  copyToClipboard: () => Promise<boolean>;
}

/**
 * Hook for single artifact operations
 *
 * @param artifactId - The ID of the artifact to operate on
 * @returns UseArtifactResult with artifact data and operations
 */
export function useArtifact(artifactId: string): UseArtifactResult {
  const {
    getArtifact,
    updateArtifact,
    removeArtifact,
    setViewMode: setViewModeStore,
    setRenderMode: setRenderModeStore,
    toggleViewMode: toggleViewModeStore,
    toggleRenderMode: toggleRenderModeStore,
  } = useArtifacts();

  const artifact = getArtifact(artifactId);

  // Computed properties
  const config = useMemo(
    () => (artifact ? ARTIFACT_CONFIGS[artifact.type] : undefined),
    [artifact]
  );

  const isEditable = useMemo(
    () => (artifact ? isArtifactEditable(artifact.type) : false),
    [artifact]
  );

  const canToggleRaw = useMemo(
    () => (artifact ? supportsRawView(artifact.type) : false),
    [artifact]
  );

  const availableExportFormats = useMemo(
    () => (artifact ? getExportFormats(artifact.type) : []),
    [artifact]
  );

  // Actions
  const setViewMode = useCallback(
    (mode: ArtifactViewMode) => {
      setViewModeStore(artifactId, mode);
    },
    [artifactId, setViewModeStore]
  );

  const setRenderMode = useCallback(
    (mode: ArtifactRenderMode) => {
      if (canToggleRaw) {
        setRenderModeStore(artifactId, mode);
      }
    },
    [artifactId, canToggleRaw, setRenderModeStore]
  );

  const toggleViewMode = useCallback(() => {
    toggleViewModeStore(artifactId);
  }, [artifactId, toggleViewModeStore]);

  const toggleRenderMode = useCallback(() => {
    if (canToggleRaw) {
      toggleRenderModeStore(artifactId);
    }
  }, [artifactId, canToggleRaw, toggleRenderModeStore]);

  const updateContent = useCallback(
    (content: string) => {
      if (isEditable) {
        updateArtifact(artifactId, { content });
      }
    },
    [artifactId, isEditable, updateArtifact]
  );

  const remove = useCallback(() => {
    removeArtifact(artifactId);
  }, [artifactId, removeArtifact]);

  // Export functionality
  const exportArtifact = useCallback(
    async (format: ExportFormat): Promise<string | void> => {
      if (!artifact) {
        throw new Error('Artifact not found');
      }

      if (!availableExportFormats.includes(format)) {
        throw new Error(`Export format ${format} not supported for this artifact type`);
      }

      switch (format) {
        case 'markdown': {
          const blob = new Blob([artifact.content], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          downloadFile(url, `${artifact.title}.md`);
          URL.revokeObjectURL(url);
          return;
        }

        case 'json': {
          const data = JSON.stringify(artifact, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          downloadFile(url, `${artifact.title}.json`);
          URL.revokeObjectURL(url);
          return;
        }

        case 'pdf':
        case 'png':
        case 'svg':
          // These formats require more complex handling (PDF renderer, canvas export)
          // For now, return a placeholder - actual implementation will use existing export libs
          console.warn(`Export to ${format} not yet implemented`);
          return;

        default:
          throw new Error(`Unknown export format: ${format}`);
      }
    },
    [artifact, availableExportFormats]
  );

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    if (!artifact) return false;

    try {
      await navigator.clipboard.writeText(artifact.content);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [artifact]);

  return {
    artifact,
    isEditable,
    canToggleRaw,
    availableExportFormats,
    config,
    setViewMode,
    setRenderMode,
    toggleViewMode,
    toggleRenderMode,
    updateContent,
    remove,
    exportArtifact,
    copyToClipboard,
  };
}

/**
 * Helper to trigger file download
 */
function downloadFile(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
