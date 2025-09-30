'use client';

/**
 * Enhanced Canvas Workspace
 * Integrates tldraw for drawing and Mermaid for diagrams
 */

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Editor } from 'tldraw';
import MermaidEditor from './MermaidEditor';
import CanvasExportModal from '../../../components/canvas/CanvasExportModal';

// Dynamically import tldraw to avoid SSR issues
const TldrawCanvas = dynamic(() => import('./TldrawCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
});

export interface EnhancedCanvasWorkspaceProps {
  workspaceId: string;
  sessionId?: string;
  initialMode?: 'draw' | 'diagram';
  initialDiagramCode?: string;
  initialDiagramType?: string;
  onStateChange?: (state: any) => void;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

type CanvasMode = 'draw' | 'diagram';

export const EnhancedCanvasWorkspace: React.FC<EnhancedCanvasWorkspaceProps> = ({
  workspaceId,
  sessionId,
  initialMode = 'draw',
  initialDiagramCode = '',
  initialDiagramType,
  onStateChange,
  onSave,
  readOnly = false
}) => {
  const [mode, setMode] = useState<CanvasMode>(initialMode);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [mermaidCode, setMermaidCode] = useState(initialDiagramCode);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Handle tldraw mount
  const handleTldrawMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  // Handle tldraw save
  const handleTldrawSave = useCallback(async (snapshot: any) => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_canvas_state',
          sessionId,
          canvasState: {
            mode: 'draw',
            snapshot
          }
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        onSave?.({ mode: 'draw', snapshot });
      }
    } catch (error) {
      console.error('Failed to save tldraw state:', error);
    }
  }, [sessionId, onSave]);

  // Handle Mermaid save
  const handleMermaidSave = useCallback(async (code: string) => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_canvas_state',
          sessionId,
          canvasState: {
            mode: 'diagram',
            mermaidCode: code
          }
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        onSave?.({ mode: 'diagram', mermaidCode: code });
      }
    } catch (error) {
      console.error('Failed to save Mermaid diagram:', error);
    }
  }, [sessionId, onSave]);

  // Handle Mermaid code change
  const handleMermaidChange = useCallback((code: string) => {
    setMermaidCode(code);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle between draw and diagram mode (Ctrl+Shift+M)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'm') {
        e.preventDefault();
        setMode(prev => prev === 'draw' ? 'diagram' : 'draw');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load initial state
  useEffect(() => {
    const loadCanvasState = async () => {
      try {
        const response = await fetch('/api/bmad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load_canvas_state',
            sessionId
          })
        });

        if (response.ok) {
          const { data } = await response.json();
          if (data?.canvasState) {
            if (data.canvasState.mode === 'diagram' && data.canvasState.mermaidCode) {
              setMermaidCode(data.canvasState.mermaidCode);
              setMode('diagram');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load canvas state:', error);
      }
    };

    loadCanvasState();
  }, [sessionId]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-1 mr-4">
            <button
              onClick={() => setMode('draw')}
              className={`px-3 py-1.5 rounded transition-colors ${
                mode === 'draw'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Freeform Drawing (Ctrl+Shift+M)"
            >
              ✏️ Draw
            </button>
            <button
              onClick={() => setMode('diagram')}
              className={`px-3 py-1.5 rounded transition-colors ${
                mode === 'diagram'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Mermaid Diagrams (Ctrl+Shift+M)"
            >
              📊 Diagram
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-1.5"
            title="Export canvas as PNG or SVG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            {lastSaved && (
              <span>
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {sessionId && (
              <>
                <span className="text-gray-400">•</span>
                <span>Session: {sessionId.slice(0, 8)}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'draw' ? (
          <TldrawCanvas
            sessionId={sessionId}
            onMount={handleTldrawMount}
            onSave={handleTldrawSave}
            readOnly={readOnly}
          />
        ) : (
          <MermaidEditor
            initialCode={mermaidCode}
            onChange={handleMermaidChange}
            onSave={handleMermaidSave}
          />
        )}
      </div>

      {/* Help Text */}
      {!readOnly && (
        <div className="p-2 bg-white border-t border-gray-200 text-xs text-gray-500 flex items-center gap-4">
          <span>💡 Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-700">Ctrl+Shift+M</kbd> to toggle between drawing and diagrams</span>
          <span className="text-gray-400">•</span>
          <span>Auto-save every 30 seconds</span>
        </div>
      )}

      {/* Export Modal */}
      <CanvasExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        mode={mode}
        tldrawEditor={editor}
        diagramCode={mermaidCode}
        workspaceId={workspaceId}
        workspaceName={`Workspace ${workspaceId.slice(0, 8)}`}
      />
    </div>
  );
};

export default EnhancedCanvasWorkspace;
