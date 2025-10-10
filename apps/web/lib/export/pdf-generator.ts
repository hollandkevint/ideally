/**
 * PDF Generation Service
 * Story 3.1: Generate professional PDFs using @react-pdf/renderer
 */

import { renderToBuffer, renderToStream } from '@react-pdf/renderer';
import { createElement } from 'react';
import FeatureBriefPDF from './pdf-templates/FeatureBriefPDF';
import { FeatureBrief } from '../bmad/types';

export interface PDFBranding {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface PDFGenerationOptions {
  branding?: PDFBranding;
  fileName?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  stream?: NodeJS.ReadableStream;
  fileName: string;
  error?: string;
}

/**
 * Generate PDF buffer from Feature Brief
 * Server-side generation for API endpoints
 */
export async function generateFeatureBriefPDF(
  brief: FeatureBrief,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  try {
    const fileName = options.fileName || getDefaultFileName(brief);

    // Create React PDF document
    const doc = createElement(FeatureBriefPDF, {
      brief,
      branding: options.branding,
    });

    // Render to buffer
    const buffer = await renderToBuffer(doc);

    return {
      success: true,
      buffer,
      fileName,
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      fileName: options.fileName || 'feature-brief.pdf',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate PDF stream from Feature Brief
 * Useful for streaming responses or file uploads
 */
export async function generateFeatureBriefPDFStream(
  brief: FeatureBrief,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  try {
    const fileName = options.fileName || getDefaultFileName(brief);

    // Create React PDF document
    const doc = createElement(FeatureBriefPDF, {
      brief,
      branding: options.branding,
    });

    // Render to stream
    const stream = await renderToStream(doc);

    return {
      success: true,
      stream,
      fileName,
    };
  } catch (error) {
    console.error('PDF stream generation error:', error);
    return {
      success: false,
      fileName: options.fileName || 'feature-brief.pdf',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate default file name from brief title
 */
function getDefaultFileName(brief: FeatureBrief): string {
  const sanitizedTitle = brief.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${sanitizedTitle}-brief-${timestamp}.pdf`;
}

/**
 * Get PDF MIME type
 */
export function getPDFMimeType(): string {
  return 'application/pdf';
}

/**
 * Create downloadable blob from PDF buffer (client-side utility)
 */
export function createPDFBlob(buffer: Buffer): Blob {
  return new Blob([buffer], { type: getPDFMimeType() });
}

/**
 * Trigger browser download of PDF (client-side utility)
 */
export function downloadPDF(buffer: Buffer, fileName: string): void {
  const blob = createPDFBlob(buffer);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate branding configuration
 */
export function validateBranding(branding?: PDFBranding): boolean {
  if (!branding) return true;

  // Company name validation
  if (branding.companyName && branding.companyName.length > 100) {
    return false;
  }

  // Logo URL validation
  if (branding.logoUrl) {
    try {
      new URL(branding.logoUrl);
    } catch {
      return false;
    }
  }

  // Color validation (hex format)
  if (branding.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(branding.primaryColor)) {
    return false;
  }

  return true;
}

/**
 * Get estimated PDF file size (rough estimate in KB)
 */
export function estimatePDFSize(brief: FeatureBrief): number {
  // Base size ~20KB for template and styling
  let size = 20;

  // Add size for content (rough estimate)
  size += Math.ceil(brief.description.length / 100);
  size += brief.userStories.length * 2;
  size += brief.acceptanceCriteria.length * 2;
  size += brief.successMetrics.length * 2;
  size += brief.implementationNotes.length * 2;

  return size; // Returns estimated size in KB
}

/**
 * Performance monitoring for PDF generation
 */
export async function generateWithTiming(
  brief: FeatureBrief,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult & { generationTime: number }> {
  const startTime = Date.now();

  const result = await generateFeatureBriefPDF(brief, options);

  const generationTime = Date.now() - startTime;

  return {
    ...result,
    generationTime,
  };
}
