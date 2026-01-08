'use client';

/**
 * useArtifactKeyboard Hook
 *
 * Adds keyboard shortcuts for artifact panel:
 * - Cmd+Shift+A (Mac) / Ctrl+Shift+A (Windows/Linux): Toggle artifact panel
 */

import { useEffect } from 'react';
import { useArtifacts } from './artifact-store';

export function useArtifactKeyboard() {
  const { togglePanel, artifacts } = useArtifacts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        // Only toggle if there are artifacts to show
        if (artifacts.length > 0) {
          e.preventDefault();
          togglePanel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel, artifacts.length]);
}

export default useArtifactKeyboard;
