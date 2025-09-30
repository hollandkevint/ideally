/**
 * Canvas Export Utilities
 *
 * Provides PNG and SVG export functionality for both drawing (tldraw) and diagram (Mermaid) modes
 */

import mermaid from 'mermaid'

export interface ExportMetadata {
  workspaceId: string
  workspaceName: string
  exportedAt: Date
  exportedBy?: string
  canvasMode: 'draw' | 'diagram'
  diagramType?: string
  sessionInfo?: {
    messageCount: number
    duration?: string
  }
}

export interface ExportOptions {
  format: 'png' | 'svg'
  resolution?: {
    width: number
    height: number
  }
  scale?: number // 1x, 2x, 3x for retina displays
  includeMetadata?: boolean
  backgroundColor?: string
  filename?: string
}

export interface ExportResult {
  success: boolean
  blob?: Blob
  dataUrl?: string
  filename: string
  error?: string
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS: Partial<ExportOptions> = {
  scale: 2, // 2x for retina
  includeMetadata: true,
  backgroundColor: '#ffffff',
}

/**
 * Export tldraw canvas as PNG
 */
export async function exportTldrawAsPNG(
  editor: any, // Tldraw editor instance
  options: Partial<ExportOptions> = {},
  metadata?: ExportMetadata
): Promise<ExportResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const filename = opts.filename || `canvas-${Date.now()}.png`

    // Get selected shapes or all shapes
    const selectedShapes = editor.getSelectedShapeIds()
    const shapeIds = selectedShapes.length > 0
      ? selectedShapes
      : editor.getCurrentPageShapeIds()

    if (shapeIds.length === 0) {
      return {
        success: false,
        filename,
        error: 'No shapes to export'
      }
    }

    // Export as PNG using tldraw's built-in export
    const blob = await editor.exportShapes(shapeIds, 'png', {
      scale: opts.scale || 2,
      background: opts.backgroundColor !== 'transparent',
    })

    if (!blob) {
      throw new Error('Failed to generate PNG blob')
    }

    // Add metadata if requested
    const finalBlob = opts.includeMetadata && metadata
      ? await addMetadataToImage(blob, metadata)
      : blob

    // Create data URL for preview
    const dataUrl = URL.createObjectURL(finalBlob)

    return {
      success: true,
      blob: finalBlob,
      dataUrl,
      filename,
    }
  } catch (error) {
    console.error('PNG export error:', error)
    return {
      success: false,
      filename: options.filename || 'canvas-export.png',
      error: error instanceof Error ? error.message : 'Unknown export error',
    }
  }
}

/**
 * Export tldraw canvas as SVG
 */
export async function exportTldrawAsSVG(
  editor: any,
  options: Partial<ExportOptions> = {},
  metadata?: ExportMetadata
): Promise<ExportResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const filename = opts.filename || `canvas-${Date.now()}.svg`

    // Get shapes to export
    const selectedShapes = editor.getSelectedShapeIds()
    const shapeIds = selectedShapes.length > 0
      ? selectedShapes
      : editor.getCurrentPageShapeIds()

    if (shapeIds.length === 0) {
      return {
        success: false,
        filename,
        error: 'No shapes to export'
      }
    }

    // Export as SVG using tldraw's built-in export
    const blob = await editor.exportShapes(shapeIds, 'svg', {
      scale: 1, // SVG is vector, scale is always 1
      background: opts.backgroundColor !== 'transparent',
    })

    if (!blob) {
      throw new Error('Failed to generate SVG blob')
    }

    // Add metadata to SVG if requested
    const finalBlob = opts.includeMetadata && metadata
      ? await addMetadataToSVG(blob, metadata)
      : blob

    const dataUrl = URL.createObjectURL(finalBlob)

    return {
      success: true,
      blob: finalBlob,
      dataUrl,
      filename,
    }
  } catch (error) {
    console.error('SVG export error:', error)
    return {
      success: false,
      filename: options.filename || 'canvas-export.svg',
      error: error instanceof Error ? error.message : 'Unknown export error',
    }
  }
}

/**
 * Export Mermaid diagram as PNG
 */
export async function exportMermaidAsPNG(
  diagramCode: string,
  options: Partial<ExportOptions> = {},
  metadata?: ExportMetadata
): Promise<ExportResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const filename = opts.filename || `diagram-${Date.now()}.png`

    // Render Mermaid to SVG first
    const { svg } = await mermaid.render('export-diagram', diagramCode)

    // Convert SVG to PNG
    const blob = await svgToPNG(
      svg,
      opts.resolution?.width || 1920,
      opts.resolution?.height || 1080,
      opts.scale || 2,
      opts.backgroundColor || '#ffffff'
    )

    // Add metadata if requested
    const finalBlob = opts.includeMetadata && metadata
      ? await addMetadataToImage(blob, metadata)
      : blob

    const dataUrl = URL.createObjectURL(finalBlob)

    return {
      success: true,
      blob: finalBlob,
      dataUrl,
      filename,
    }
  } catch (error) {
    console.error('Mermaid PNG export error:', error)
    return {
      success: false,
      filename: options.filename || 'diagram-export.png',
      error: error instanceof Error ? error.message : 'Unknown export error',
    }
  }
}

/**
 * Export Mermaid diagram as SVG
 */
export async function exportMermaidAsSVG(
  diagramCode: string,
  options: Partial<ExportOptions> = {},
  metadata?: ExportMetadata
): Promise<ExportResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const filename = opts.filename || `diagram-${Date.now()}.svg`

    // Render Mermaid to SVG
    const { svg } = await mermaid.render('export-diagram', diagramCode)

    // Create blob from SVG string
    let finalSvg = svg

    // Add metadata if requested
    if (opts.includeMetadata && metadata) {
      finalSvg = addMetadataToSVGString(svg, metadata)
    }

    const blob = new Blob([finalSvg], { type: 'image/svg+xml' })
    const dataUrl = URL.createObjectURL(blob)

    return {
      success: true,
      blob,
      dataUrl,
      filename,
    }
  } catch (error) {
    console.error('Mermaid SVG export error:', error)
    return {
      success: false,
      filename: options.filename || 'diagram-export.svg',
      error: error instanceof Error ? error.message : 'Unknown export error',
    }
  }
}

/**
 * Convert SVG string to PNG blob
 */
async function svgToPNG(
  svgString: string,
  width: number,
  height: number,
  scale: number,
  backgroundColor: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    // Set canvas size with scale
    canvas.width = width * scale
    canvas.height = height * scale

    // Fill background
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Create image from SVG
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create PNG blob'))
        }
      }, 'image/png')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}

/**
 * Add metadata to image using PNG text chunks (tEXt)
 * Note: This requires the PNG to be decoded and re-encoded with metadata
 */
async function addMetadataToImage(
  blob: Blob,
  metadata: ExportMetadata
): Promise<Blob> {
  // For now, return original blob
  // TODO: Implement PNG tEXt chunk writing for metadata
  // This would require a PNG encoder library
  console.log('Metadata to embed:', metadata)
  return blob
}

/**
 * Add metadata to SVG blob
 */
async function addMetadataToSVG(
  blob: Blob,
  metadata: ExportMetadata
): Promise<Blob> {
  const svgText = await blob.text()
  const svgWithMetadata = addMetadataToSVGString(svgText, metadata)
  return new Blob([svgWithMetadata], { type: 'image/svg+xml' })
}

/**
 * Add metadata to SVG string
 */
function addMetadataToSVGString(
  svgString: string,
  metadata: ExportMetadata
): string {
  // Add metadata as <metadata> tag in SVG
  const metadataXML = `
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:creator>ThinkHaven Canvas</dc:creator>
        <dc:date>${metadata.exportedAt.toISOString()}</dc:date>
        <dc:identifier>${metadata.workspaceId}</dc:identifier>
        <dc:title>${metadata.workspaceName}</dc:title>
        <dc:description>Canvas Mode: ${metadata.canvasMode}${metadata.diagramType ? `, Diagram Type: ${metadata.diagramType}` : ''}</dc:description>
      </rdf:Description>
    </rdf:RDF>
  </metadata>`

  // Insert metadata after opening <svg> tag
  return svgString.replace(/(<svg[^>]*>)/, `$1${metadataXML}`)
}

/**
 * Download exported file
 */
export function downloadExport(result: ExportResult): void {
  if (!result.success || !result.blob) {
    console.error('Cannot download: Export failed', result.error)
    return
  }

  const url = result.dataUrl || URL.createObjectURL(result.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Clean up if we created the URL
  if (!result.dataUrl) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Copy exported image to clipboard
 */
export async function copyToClipboard(result: ExportResult): Promise<boolean> {
  if (!result.success || !result.blob) {
    console.error('Cannot copy: Export failed', result.error)
    return false
  }

  try {
    // Only PNG can be copied to clipboard
    if (result.filename.endsWith('.png')) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': result.blob })
      ])
      return true
    } else {
      console.warn('Only PNG images can be copied to clipboard')
      return false
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate filename with metadata
 */
export function generateFilename(
  mode: 'draw' | 'diagram',
  format: 'png' | 'svg',
  workspaceName?: string
): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const safeName = workspaceName?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'canvas'
  return `${safeName}-${mode}-${timestamp}.${format}`
}
