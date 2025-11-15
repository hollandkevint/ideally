/**
 * MarkdownOutputPane Unit Tests
 * Comprehensive test coverage for text-only markdown output component
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MarkdownOutputPane from './MarkdownOutputPane';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import toast after mock
import { toast } from 'sonner';

describe('MarkdownOutputPane', () => {
  const mockWorkspaceId = 'test-workspace-123';
  const mockOnSave = vi.fn();
  const mockMarkdown = '# Test Markdown\n\nThis is **bold** text.';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Ensure DOM is available
    if (!document.body) {
      document.body = document.createElement('body');
    }

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render in preview mode by default', () => {
      render(
        <MarkdownOutputPane
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      const previewButton = screen.getByTitle('Preview rendered markdown');
      const editButton = screen.getByTitle('Edit markdown');

      expect(previewButton).toHaveClass('bg-primary text-white');
      expect(editButton).not.toHaveClass('bg-primary text-white');
    });

    it('should render initial markdown in preview mode', () => {
      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Test Markdown')).toBeInTheDocument();
      expect(screen.getByText(/bold/)).toBeInTheDocument();
    });

    it('should show empty state when no markdown', () => {
      render(
        <MarkdownOutputPane
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('No output yet')).toBeInTheDocument();
      expect(screen.getByText(/Chat with Mary to generate/)).toBeInTheDocument();
    });

    it('should render export button', () => {
      render(
        <MarkdownOutputPane
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTitle('Download as .md file')).toBeInTheDocument();
      expect(screen.getByText('Export .md')).toBeInTheDocument();
    });
  });

  describe('Edit/Preview Mode Toggle', () => {
    it('should switch to edit mode when edit button clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      const editButton = screen.getByTitle('Edit markdown');
      await user.click(editButton);

      expect(editButton).toHaveClass('bg-primary text-white');
      expect(screen.getByPlaceholderText(/Session Summary/)).toBeInTheDocument();
    });

    it('should switch to preview mode when preview button clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      // Go to edit mode first
      await user.click(screen.getByTitle('Edit markdown'));

      // Then back to preview
      await user.click(screen.getByTitle('Preview rendered markdown'));

      const previewButton = screen.getByTitle('Preview rendered markdown');
      expect(previewButton).toHaveClass('bg-primary text-white');
    });

    it('should show textarea in edit mode', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByTitle('Edit markdown'));

      const textarea = screen.getByPlaceholderText(/Session Summary/);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue(mockMarkdown);
    });

    it('should render markdown in preview mode', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      // Should render markdown by default
      expect(screen.getByText('Test Markdown')).toBeInTheDocument();

      // Switch to edit
      await user.click(screen.getByTitle('Edit markdown'));
      expect(screen.queryByText('Test Markdown')).not.toBeInTheDocument();

      // Switch back to preview
      await user.click(screen.getByTitle('Preview rendered markdown'));
      expect(screen.getByText('Test Markdown')).toBeInTheDocument();
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should debounce save calls (1 second)', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      // Switch to edit mode
      await user.click(screen.getByTitle('Edit markdown'));

      const textarea = screen.getByPlaceholderText(/Session Summary/);

      // Type text
      await user.type(textarea, 'New text');

      // Should not save immediately
      expect(mockOnSave).not.toHaveBeenCalled();

      // Advance timers by 500ms - still not saved
      vi.advanceTimersByTime(500);
      expect(mockOnSave).not.toHaveBeenCalled();

      // Advance to 1000ms - should save now
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('New text');
      });
    });

    it('should not save if markdown unchanged from initial', async () => {
      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      // Advance timers
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // Should not call save
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show saving indicator while saving', async () => {
      const user = userEvent.setup({ delay: null });

      // Create a promise we can control
      let resolveSave: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);

      render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByTitle('Edit markdown'));
      await user.type(screen.getByPlaceholderText(/Session Summary/), 'Test');

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // Resolve save
      resolveSave!();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('should show "Saved X ago" after successful save', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByTitle('Edit markdown'));
      await user.type(screen.getByPlaceholderText(/Session Summary/), 'Test');

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Saved/)).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const saveError = new Error('Network error');
      mockOnSave.mockRejectedValue(saveError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByTitle('Edit markdown'));
      await user.type(screen.getByPlaceholderText(/Session Summary/), 'Test');

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to auto-save')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Failed to auto-save changes');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Export Functionality', () => {
    it('should download markdown file when export clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const createObjectURLSpy = vi.spyOn(global.URL, 'createObjectURL');
      const revokeObjectURLSpy = vi.spyOn(global.URL, 'revokeObjectURL');

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByTitle('Download as .md file'));

      // Verify blob creation and cleanup
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Verify toast notification
      expect(toast.success).toHaveBeenCalledWith('Markdown file downloaded');
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force createObjectURL to throw
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Blob error');
      });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByTitle('Download as .md file'));

      expect(toast.error).toHaveBeenCalledWith('Failed to export markdown file');

      consoleErrorSpy.mockRestore();
    });

    it('should call export function when export button clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      const exportButton = screen.getByTitle('Download as .md file');
      expect(exportButton).toBeInTheDocument();

      await user.click(exportButton);

      // Should trigger the export function (verified by toast)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Markdown file downloaded');
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy markdown to clipboard when copy button clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByText('📋 Copy Markdown'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMarkdown);
      expect(toast.success).toHaveBeenCalledWith('Markdown copied to clipboard');
    });

    it('should handle clipboard errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const clipboardError = new Error('Clipboard denied');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Re-define clipboard with rejecting mock
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(clipboardError),
        },
        writable: true,
        configurable: true,
      });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByText('📋 Copy Markdown'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy markdown to clipboard');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should only show copy button in preview mode with content', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown={mockMarkdown}
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      // Should be visible in preview mode
      expect(screen.getByText('📋 Copy Markdown')).toBeInTheDocument();

      // Switch to edit mode
      await user.click(screen.getByTitle('Edit markdown'));

      // Fast-forward timers
      await vi.runAllTimersAsync();

      // Should not be visible in edit mode
      expect(screen.queryByText('📋 Copy Markdown')).not.toBeInTheDocument();
    });

    it('should not show copy button when no markdown', () => {
      render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('📋 Copy Markdown')).not.toBeInTheDocument();
    });
  });

  describe('Props and State Updates', () => {
    it('should update markdown when initialMarkdown prop changes', () => {
      const { rerender } = render(
        <MarkdownOutputPane
          initialMarkdown="First markdown"
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('First markdown')).toBeInTheDocument();

      rerender(
        <MarkdownOutputPane
          initialMarkdown="Updated markdown"
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Updated markdown')).toBeInTheDocument();
      expect(screen.queryByText('First markdown')).not.toBeInTheDocument();
    });

    it('should work without onSave callback', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
        />
      );

      await user.click(screen.getByTitle('Edit markdown'));

      const textarea = screen.getByPlaceholderText(/Session Summary/);
      await user.type(textarea, 'Test');

      // Advance timers and run to completion
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(textarea).toHaveValue('Test');
      });
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should show saved status after successful save', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MarkdownOutputPane
          initialMarkdown=""
          workspaceId={mockWorkspaceId}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByTitle('Edit markdown'));

      const textarea = screen.getByPlaceholderText(/Session Summary/);
      await user.type(textarea, 'Test');

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Should show saved status (either "just now" or "Xs ago")
      await waitFor(() => {
        expect(screen.getByText(/Saved/)).toBeInTheDocument();
      });
    });
  });
});
