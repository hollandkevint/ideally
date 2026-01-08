'use client';

/**
 * ArtifactKeyboardHandler Component
 *
 * Invisible component that enables keyboard shortcuts for artifacts.
 * Must be rendered inside ArtifactProvider.
 */

import { useArtifactKeyboard } from '@/lib/artifact';

export function ArtifactKeyboardHandler() {
  useArtifactKeyboard();
  return null;
}

export default ArtifactKeyboardHandler;
