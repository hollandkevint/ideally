'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Edit3, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface MarkdownOutputPaneProps {
  initialMarkdown?: string;
  workspaceId: string;
  onSave?: (markdown: string) => Promise<void>;
  className?: string;
}

type ViewMode = 'edit' | 'preview';

/**
 * MarkdownOutputPane - Text-only output view for strategic sessions
 *
 * Features:
 * - Edit mode: Simple textarea for markdown editing
 * - Preview mode: Rendered markdown (NO Mermaid/diagrams)
 * - Auto-save with 1s debounce
 * - Export as .md file
 * - Copy to clipboard
 */
export default function MarkdownOutputPane({
  initialMarkdown = '',
  workspaceId,
  onSave,
  className = ''
}: MarkdownOutputPaneProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-save with debounce
  useEffect(() => {
    if (markdown === initialMarkdown) return; // Don't save if unchanged

    const timeoutId = setTimeout(async () => {
      try {
        setIsSaving(true);
        setSaveError(null);

        if (onSave) {
          await onSave(markdown);
        }

        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save markdown:', error);
        setSaveError('Failed to auto-save');
        toast.error('Failed to auto-save changes');
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [markdown, onSave, initialMarkdown]);

  // Update when initial markdown changes (e.g., from auto-generation)
  useEffect(() => {
    setMarkdown(initialMarkdown);
  }, [initialMarkdown]);

  const handleExportMarkdown = useCallback(() => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strategic-session-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Markdown file downloaded');
    } catch (error) {
      console.error('Failed to export markdown:', error);
      toast.error('Failed to export markdown file');
    }
  }, [markdown]);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success('Markdown copied to clipboard');
    } catch (error) {
      console.error('Failed to copy markdown:', error);
      toast.error('Failed to copy markdown to clipboard');
    }
  }, [markdown]);

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`markdown-output-pane flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-divider bg-surface">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              viewMode === 'edit'
                ? 'bg-primary text-white'
                : 'text-secondary hover:bg-primary/10 hover:text-primary'
            }`}
            title="Edit markdown"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              viewMode === 'preview'
                ? 'bg-primary text-white'
                : 'text-secondary hover:bg-primary/10 hover:text-primary'
            }`}
            title="Preview rendered markdown"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          {lastSaved && (
            <span className="text-xs text-secondary">
              {isSaving ? 'Saving...' : `Saved ${formatTimeAgo(lastSaved)}`}
            </span>
          )}
          {saveError && (
            <span className="text-xs text-error">{saveError}</span>
          )}

          {/* Export button */}
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
            title="Download as .md file"
          >
            <Download className="w-4 h-4" />
            Export .md
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' ? (
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-surface text-primary"
            placeholder="# Session Summary

Your structured output will appear here as you chat with Mary.

You can also edit this markdown directly..."
            spellCheck={false}
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 bg-surface">
            {markdown ? (
              <article className="prose prose-sm max-w-none prose-headings:text-primary prose-p:text-secondary prose-strong:text-primary prose-a:text-primary hover:prose-a:text-primary-hover">
                <ReactMarkdown
                  components={{
                    // NO Mermaid rendering - text only
                    code({ node, inline, className, children, ...props }) {
                      return inline ? (
                        <code className="bg-primary/10 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-primary/5 p-4 rounded overflow-x-auto">
                          <code className="text-xs font-mono" {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-secondary">
                <p className="mb-2">No output yet</p>
                <p className="text-sm">
                  Chat with Mary to generate your strategic session summary
                </p>
              </div>
            )}

            {/* Copy button (appears in preview mode) */}
            {markdown && (
              <button
                onClick={handleCopyMarkdown}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
              >
                📋 Copy Markdown
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
