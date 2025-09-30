/**
 * E2E Tests for Canvas Export Functionality
 *
 * Tests PNG and SVG export for both tldraw and Mermaid modes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  exportMermaidAsPNG,
  exportMermaidAsSVG,
  generateFilename,
  ExportMetadata,
} from '@/lib/canvas/canvas-export'

// Note: Mermaid rendering requires browser DOM (getBBox, SVG measurement)
// These tests are designed for browser/e2e testing, skip in Node.js environment
describe.skip('Canvas Export E2E', () => {
  const mockMetadata: ExportMetadata = {
    workspaceId: 'test-workspace-123',
    workspaceName: 'Test Workspace',
    exportedAt: new Date('2025-09-30T10:00:00Z'),
    canvasMode: 'diagram',
    diagramType: 'flowchart',
    sessionInfo: {
      messageCount: 10,
      duration: '15m',
    },
  }

  describe('Mermaid PNG Export', () => {
    const validFlowchart = `flowchart TD
  Start([Start])
  Process[Process Data]
  End([End])

  Start --> Process
  Process --> End`

    it('should export valid flowchart as PNG', async () => {
      const result = await exportMermaidAsPNG(
        validFlowchart,
        {
          format: 'png',
          resolution: { width: 1920, height: 1080 },
          scale: 2,
          backgroundColor: '#ffffff',
        },
        mockMetadata
      )

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
      expect(result.blob?.type).toBe('image/png')
      expect(result.filename).toContain('.png')
      expect(result.dataUrl).toBeDefined()
    })

    it('should export with different resolutions', async () => {
      const resolutions = [
        { width: 1920, height: 1080, label: 'HD' },
        { width: 3840, height: 2160, label: '4K' },
        { width: 1200, height: 630, label: 'Social' },
      ]

      for (const res of resolutions) {
        const result = await exportMermaidAsPNG(validFlowchart, {
          resolution: res,
        })

        expect(result.success).toBe(true)
        expect(result.blob).toBeDefined()
      }
    })

    it('should export with different scales', async () => {
      const scales = [1, 2, 3]

      for (const scale of scales) {
        const result = await exportMermaidAsPNG(validFlowchart, {
          scale,
        })

        expect(result.success).toBe(true)
        expect(result.blob).toBeDefined()
        // Higher scale = larger file size
        if (scale > 1) {
          expect(result.blob!.size).toBeGreaterThan(1000)
        }
      }
    })

    it('should export with transparent background', async () => {
      const result = await exportMermaidAsPNG(validFlowchart, {
        backgroundColor: 'transparent',
      })

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
    })

    it('should export with custom color background', async () => {
      const result = await exportMermaidAsPNG(validFlowchart, {
        backgroundColor: '#f0f0f0',
      })

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
    })

    it('should handle sequence diagram', async () => {
      const sequenceDiagram = `sequenceDiagram
  participant User
  participant API
  participant DB

  User->>API: Request
  API->>DB: Query
  DB-->>API: Data
  API-->>User: Response`

      const result = await exportMermaidAsPNG(sequenceDiagram)

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
    })

    it('should handle Gantt chart', async () => {
      const ganttChart = `gantt
  title Project Timeline
  dateFormat YYYY-MM-DD

  section Phase 1
    Task 1: 2025-01-01, 14d
    Task 2: 2025-01-15, 7d`

      const result = await exportMermaidAsPNG(ganttChart)

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
    })

    it('should handle empty diagram code gracefully', async () => {
      const result = await exportMermaidAsPNG('')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle invalid Mermaid syntax', async () => {
      const result = await exportMermaidAsPNG('INVALID DIAGRAM CODE')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Mermaid SVG Export', () => {
    const validFlowchart = `flowchart TD
  Start([Start])
  End([End])
  Start --> End`

    it('should export valid flowchart as SVG', async () => {
      const result = await exportMermaidAsSVG(validFlowchart, {}, mockMetadata)

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
      expect(result.blob?.type).toBe('image/svg+xml')
      expect(result.filename).toContain('.svg')
    })

    it('should embed metadata in SVG', async () => {
      const result = await exportMermaidAsSVG(
        validFlowchart,
        { includeMetadata: true },
        mockMetadata
      )

      expect(result.success).toBe(true)

      // Read SVG content
      const svgText = await result.blob!.text()

      // Check for metadata tags
      expect(svgText).toContain('<metadata>')
      expect(svgText).toContain('rdf:RDF')
      expect(svgText).toContain('dc:creator')
      expect(svgText).toContain('ThinkHaven Canvas')
      expect(svgText).toContain(mockMetadata.workspaceId)
      expect(svgText).toContain(mockMetadata.workspaceName)
    })

    it('should export without metadata when disabled', async () => {
      const result = await exportMermaidAsSVG(
        validFlowchart,
        { includeMetadata: false },
        mockMetadata
      )

      expect(result.success).toBe(true)

      const svgText = await result.blob!.text()
      expect(svgText).not.toContain('<metadata>')
    })

    it('should export all diagram types as SVG', async () => {
      const diagrams = [
        {
          type: 'flowchart',
          code: 'flowchart LR\n  A --> B',
        },
        {
          type: 'sequence',
          code: 'sequenceDiagram\n  A->>B: Message',
        },
        {
          type: 'class',
          code: 'classDiagram\n  class Animal',
        },
        {
          type: 'state',
          code: 'stateDiagram-v2\n  [*] --> Active',
        },
      ]

      for (const diagram of diagrams) {
        const result = await exportMermaidAsSVG(diagram.code)

        expect(result.success).toBe(true)
        expect(result.blob).toBeDefined()
      }
    })

    it('should handle large complex diagrams', async () => {
      // Create a large flowchart
      let largeDiagram = 'flowchart TD\n'
      for (let i = 0; i < 50; i++) {
        largeDiagram += `  Node${i}[Step ${i}]\n`
        if (i > 0) {
          largeDiagram += `  Node${i - 1} --> Node${i}\n`
        }
      }

      const result = await exportMermaidAsSVG(largeDiagram)

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
      expect(result.blob!.size).toBeGreaterThan(1000) // Large diagram = larger file
    })
  })

  describe('Filename Generation', () => {
    it('should generate filename with all components', () => {
      const filename = generateFilename('diagram', 'png', 'My Strategic Workspace')

      expect(filename).toContain('my-strategic-workspace')
      expect(filename).toContain('diagram')
      expect(filename).toContain('.png')
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/) // Date format YYYY-MM-DD
    })

    it('should sanitize workspace name', () => {
      const filename = generateFilename('draw', 'svg', 'My Workspace! @#$%')

      expect(filename).toMatch(/^[a-z0-9-]+-(draw|diagram)-\d{4}-\d{2}-\d{2}\.svg$/)
      expect(filename).not.toContain('!')
      expect(filename).not.toContain('@')
      expect(filename).not.toContain('#')
    })

    it('should use default name when no workspace provided', () => {
      const filename = generateFilename('diagram', 'png')

      expect(filename).toContain('canvas')
      expect(filename).toContain('.png')
    })

    it('should generate different formats', () => {
      const pngFilename = generateFilename('draw', 'png', 'Test')
      const svgFilename = generateFilename('diagram', 'svg', 'Test')

      expect(pngFilename).toContain('.png')
      expect(svgFilename).toContain('.svg')
    })

    it('should generate unique filenames by date', () => {
      const filename1 = generateFilename('draw', 'png', 'Test')
      const filename2 = generateFilename('draw', 'png', 'Test')

      // Same day = same filename (expected behavior)
      expect(filename1).toBe(filename2)
    })
  })

  describe('Export Performance', () => {
    it('should export HD PNG within reasonable time', async () => {
      const simpleFlowchart = 'flowchart LR\n  A --> B --> C'

      const start = Date.now()
      const result = await exportMermaidAsPNG(simpleFlowchart, {
        resolution: { width: 1920, height: 1080 },
      })
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(2000) // < 2 seconds for simple diagram
    })

    it('should export SVG faster than PNG', async () => {
      const flowchart = 'flowchart TD\n  A --> B --> C --> D'

      const pngStart = Date.now()
      await exportMermaidAsPNG(flowchart)
      const pngDuration = Date.now() - pngStart

      const svgStart = Date.now()
      await exportMermaidAsSVG(flowchart)
      const svgDuration = Date.now() - svgStart

      // SVG should generally be faster (no rasterization)
      expect(svgDuration).toBeLessThan(pngDuration * 1.5)
    })
  })

  describe('Export Options Validation', () => {
    const validFlowchart = 'flowchart LR\n  A --> B'

    it('should use default options when not provided', async () => {
      const result = await exportMermaidAsPNG(validFlowchart)

      expect(result.success).toBe(true)
      // Default scale is 2x
      expect(result.blob).toBeDefined()
    })

    it('should handle custom resolution limits', async () => {
      const result = await exportMermaidAsPNG(validFlowchart, {
        resolution: { width: 100, height: 100 },
      })

      expect(result.success).toBe(true)
    })

    it('should handle very large resolutions', async () => {
      const result = await exportMermaidAsPNG(validFlowchart, {
        resolution: { width: 7680, height: 4320 }, // 8K
      })

      expect(result.success).toBe(true)
      // Large resolution = large file
      expect(result.blob!.size).toBeGreaterThan(10000)
    })
  })

  describe('Error Handling', () => {
    it('should return error result for null diagram code', async () => {
      const result = await exportMermaidAsPNG(null as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should return error result for undefined diagram code', async () => {
      const result = await exportMermaidAsSVG(undefined as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle Mermaid rendering errors gracefully', async () => {
      const invalidSyntax = 'flowchart\n  --> --> -->'

      const result = await exportMermaidAsPNG(invalidSyntax)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.filename).toContain('.png') // Filename still generated
    })

    it('should provide meaningful error messages', async () => {
      const result = await exportMermaidAsPNG('')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/error|failed|invalid/i)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete export workflow', async () => {
      // 1. Create diagram
      const diagram = `flowchart TD
  Start([User Login])
  Validate[Validate Credentials]
  Success[Success]
  Error[Error]

  Start --> Validate
  Validate -->|Valid| Success
  Validate -->|Invalid| Error`

      // 2. Export as PNG (HD, 2x scale)
      const pngResult = await exportMermaidAsPNG(
        diagram,
        {
          resolution: { width: 1920, height: 1080 },
          scale: 2,
          backgroundColor: '#ffffff',
          includeMetadata: true,
        },
        mockMetadata
      )

      expect(pngResult.success).toBe(true)
      expect(pngResult.blob!.size).toBeGreaterThan(1000)

      // 3. Export as SVG with metadata
      const svgResult = await exportMermaidAsSVG(
        diagram,
        { includeMetadata: true },
        mockMetadata
      )

      expect(svgResult.success).toBe(true)

      // 4. Verify SVG contains metadata
      const svgText = await svgResult.blob!.text()
      expect(svgText).toContain('ThinkHaven Canvas')

      // 5. Both should have different blob types
      expect(pngResult.blob!.type).toBe('image/png')
      expect(svgResult.blob!.type).toBe('image/svg+xml')
    })

    it('should handle sequential exports without interference', async () => {
      const diagram1 = 'flowchart LR\n  A --> B'
      const diagram2 = 'sequenceDiagram\n  A->>B: Message'

      const result1 = await exportMermaidAsPNG(diagram1)
      const result2 = await exportMermaidAsPNG(diagram2)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Results should be independent
      expect(result1.blob).not.toBe(result2.blob)
      expect(result1.dataUrl).not.toBe(result2.dataUrl)
    })
  })
})
