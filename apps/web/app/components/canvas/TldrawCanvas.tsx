'use client';

/**
 * Tldraw Canvas Component
 * Wrapper for tldraw editor with custom tools and persistence
 */

import React, { useCallback, useEffect } from 'react';
import { Tldraw, TLComponents, Editor, TLUiOverrides } from 'tldraw';
import 'tldraw/tldraw.css';

export interface TldrawCanvasProps {
  sessionId: string;
  onMount?: (editor: Editor) => void;
  onSave?: (snapshot: any) => void;
  initialSnapshot?: any;
  readOnly?: boolean;
}

export const TldrawCanvas: React.FC<TldrawCanvasProps> = ({
  sessionId,
  onMount,
  onSave,
  initialSnapshot,
  readOnly = false
}) => {
  const [editor, setEditor] = React.useState<Editor | null>(null);

  // Handle editor mount
  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);

    // Load initial snapshot if provided
    if (initialSnapshot) {
      try {
        editor.store.loadSnapshot(initialSnapshot);
      } catch (error) {
        console.error('Failed to load initial snapshot:', error);
      }
    }

    onMount?.(editor);
  }, [initialSnapshot, onMount]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!editor || readOnly) return;

    const saveInterval = setInterval(() => {
      try {
        const snapshot = editor.store.getSnapshot();
        onSave?.(snapshot);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(saveInterval);
  }, [editor, onSave, readOnly]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (editor && !readOnly) {
        try {
          const snapshot = editor.store.getSnapshot();
          onSave?.(snapshot);
        } catch (error) {
          console.error('Save on unmount failed:', error);
        }
      }
    };
  }, [editor, onSave, readOnly]);

  // Custom UI overrides
  const uiOverrides: TLUiOverrides = {
    tools(editor, tools) {
      // Customize or add tools here
      return tools;
    },
    actions(editor, actions) {
      // Add custom actions
      return {
        ...actions,
        'save-canvas': {
          id: 'save-canvas',
          label: 'Save Canvas',
          kbd: '$s',
          onSelect() {
            try {
              const snapshot = editor.store.getSnapshot();
              onSave?.(snapshot);
            } catch (error) {
              console.error('Manual save failed:', error);
            }
          },
        },
      };
    },
  };

  // Custom components for hiding certain UI elements if needed
  const components: TLComponents = {
    // You can customize UI components here
    // For example, hide certain panels or add custom ones
  };

  return (
    <div className="tldraw-container" style={{ height: '100%', width: '100%' }}>
      <Tldraw
        onMount={handleMount}
        overrides={uiOverrides}
        components={components}
        autoFocus={!readOnly}
        inferDarkMode
      />
    </div>
  );
};

export default TldrawCanvas;
