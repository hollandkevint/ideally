/**
 * Lean Canvas PDF Template
 * Story 6.4: Professional PDF generation for Lean Canvas with viability scoring
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { GeneratedCanvas, CanvasSection } from '@/lib/bmad/generators/lean-canvas-generator';
import type { KillRecommendation } from '@/lib/ai/mary-persona';

// ThinkHaven color palette (Wes Anderson inspired)
const colors = {
  cream: '#F5F2E9',
  parchment: '#E8E4D9',
  terracotta: '#C65D3B',
  forest: '#3D5A45',
  ink: '#2C2C2C',
  slateBlue: '#5A6B7A',
  mustard: '#C6A664',
  rust: '#A14D3A',
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.cream,
    padding: 24,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `2px solid ${colors.terracotta}`,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: colors.slateBlue,
    fontStyle: 'italic',
  },
  branding: {
    position: 'absolute',
    top: 24,
    right: 24,
    fontSize: 9,
    color: colors.terracotta,
    fontWeight: 'bold',
  },
  // Canvas Grid - 3x3 layout
  canvasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  // Section boxes - vary by position
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    marginRight: 8,
    minHeight: 80,
  },
  sectionSmall: {
    width: '31%',
  },
  sectionMedium: {
    width: '48%',
  },
  sectionWide: {
    width: '97%',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.forest,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 8,
    color: colors.ink,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    fontSize: 8,
    color: colors.terracotta,
    marginRight: 4,
    width: 10,
  },
  bulletText: {
    fontSize: 8,
    color: colors.ink,
    flex: 1,
  },
  placeholder: {
    fontSize: 8,
    color: colors.slateBlue,
    fontStyle: 'italic',
  },
  // Feasibility indicator
  feasibilityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 7,
    padding: '2px 4px',
    borderRadius: 2,
    fontWeight: 'bold',
  },
  // Viability Section
  viabilitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    borderLeft: `4px solid ${colors.terracotta}`,
  },
  viabilityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 10,
  },
  viabilityScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.terracotta,
    marginBottom: 4,
  },
  viabilityLabel: {
    fontSize: 9,
    color: colors.slateBlue,
    marginBottom: 12,
  },
  // Dimension grid
  dimensionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dimensionItem: {
    width: '32%',
    marginBottom: 8,
    marginRight: '1%',
  },
  dimensionName: {
    fontSize: 8,
    color: colors.slateBlue,
    marginBottom: 2,
  },
  dimensionScore: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Recommended action
  actionBox: {
    backgroundColor: colors.parchment,
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  actionLabel: {
    fontSize: 9,
    color: colors.slateBlue,
    marginBottom: 4,
  },
  actionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  actionSummary: {
    fontSize: 9,
    color: colors.ink,
    lineHeight: 1.4,
  },
  // Critical issues
  issuesList: {
    marginTop: 10,
  },
  issueItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  issueIcon: {
    fontSize: 8,
    color: colors.rust,
    marginRight: 4,
  },
  issueText: {
    fontSize: 8,
    color: colors.ink,
    flex: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `1px solid ${colors.parchment}`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.slateBlue,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    fontSize: 8,
    color: colors.slateBlue,
  },
  // Draft watermark
  draftWatermark: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    fontSize: 48,
    color: colors.parchment,
    opacity: 0.5,
    transform: 'rotate(-30deg)',
  },
});

interface LeanCanvasPDFProps {
  canvas: GeneratedCanvas;
  killRecommendation?: KillRecommendation;
  branding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

function getScoreColor(score: number): string {
  if (score >= 7) return colors.forest;
  if (score >= 5) return colors.mustard;
  if (score >= 3) return colors.rust;
  return colors.rust;
}

function getActionColor(action: string): string {
  switch (action) {
    case 'proceed': return colors.forest;
    case 'pivot': return colors.mustard;
    case 'kill': return colors.rust;
    default: return colors.slateBlue;
  }
}

function SectionBox({
  section,
  size = 'small'
}: {
  section: CanvasSection;
  size?: 'small' | 'medium' | 'wide';
}) {
  const sizeStyle = size === 'wide' ? styles.sectionWide :
                    size === 'medium' ? styles.sectionMedium :
                    styles.sectionSmall;

  return (
    <View style={[styles.sectionBox, sizeStyle]}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.content.length > 0 ? (
        section.content.map((item, idx) => (
          <View key={idx} style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.placeholder}>To be defined</Text>
      )}
      {section.feasibilityScore && (
        <Text style={[
          styles.feasibilityBadge,
          { backgroundColor: getScoreColor(section.feasibilityScore / 10), color: '#FFFFFF' }
        ]}>
          {section.feasibilityScore}%
        </Text>
      )}
    </View>
  );
}

export default function LeanCanvasPDF({
  canvas,
  killRecommendation,
  branding
}: LeanCanvasPDFProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Map sections by ID for easy access
  const sectionMap = new Map(canvas.sections.map(s => [s.id, s]));

  const isDraft = canvas.metadata.completeness < 60;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Draft watermark */}
        {isDraft && <Text style={styles.draftWatermark}>DRAFT</Text>}

        {/* Branding */}
        <Text style={styles.branding}>
          {branding?.companyName || 'ThinkHaven'}
        </Text>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{canvas.title}</Text>
          <Text style={styles.subtitle}>
            Generated on {formatDate(canvas.metadata.generatedAt)} | Completeness: {canvas.metadata.completeness}%
          </Text>
        </View>

        {/* Canvas Grid - Lean Canvas Layout */}
        <View style={styles.canvasGrid}>
          {/* Row 1: Problem, Solution, UVP, Unfair Advantage, Customer Segments */}
          {sectionMap.get('problem') && <SectionBox section={sectionMap.get('problem')!} size="small" />}
          {sectionMap.get('solution') && <SectionBox section={sectionMap.get('solution')!} size="small" />}
          {sectionMap.get('unique-value-proposition') && <SectionBox section={sectionMap.get('unique-value-proposition')!} size="small" />}

          {/* Row 2: Key Metrics, Channels */}
          {sectionMap.get('unfair-advantage') && <SectionBox section={sectionMap.get('unfair-advantage')!} size="small" />}
          {sectionMap.get('customer-segments') && <SectionBox section={sectionMap.get('customer-segments')!} size="small" />}
          {sectionMap.get('key-metrics') && <SectionBox section={sectionMap.get('key-metrics')!} size="small" />}

          {/* Row 3: Cost Structure, Revenue Streams */}
          {sectionMap.get('channels') && <SectionBox section={sectionMap.get('channels')!} size="small" />}
          {sectionMap.get('cost-structure') && <SectionBox section={sectionMap.get('cost-structure')!} size="medium" />}
          {sectionMap.get('revenue-streams') && <SectionBox section={sectionMap.get('revenue-streams')!} size="medium" />}
        </View>

        {/* Viability Assessment */}
        {killRecommendation && (
          <View style={styles.viabilitySection}>
            <Text style={styles.viabilityTitle}>Viability Assessment</Text>

            <View style={{ flexDirection: 'row' }}>
              {/* Score */}
              <View style={{ width: '20%' }}>
                <Text style={styles.viabilityScore}>
                  {killRecommendation.viabilityScore.overall}/10
                </Text>
                <Text style={styles.viabilityLabel}>Overall Score</Text>
              </View>

              {/* Dimensions */}
              <View style={[styles.dimensionGrid, { width: '50%' }]}>
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionName}>Problem Clarity</Text>
                  <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.problemClarity) }]}>
                    {killRecommendation.viabilityScore.dimensions.problemClarity}/10
                  </Text>
                </View>
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionName}>Target User</Text>
                  <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.targetUserClarity) }]}>
                    {killRecommendation.viabilityScore.dimensions.targetUserClarity}/10
                  </Text>
                </View>
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionName}>Solution Fit</Text>
                  <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.solutionFit) }]}>
                    {killRecommendation.viabilityScore.dimensions.solutionFit}/10
                  </Text>
                </View>
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionName}>Competitive Moat</Text>
                  <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.competitiveMoat) }]}>
                    {killRecommendation.viabilityScore.dimensions.competitiveMoat}/10
                  </Text>
                </View>
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionName}>Revenue</Text>
                  <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.revenueViability) }]}>
                    {killRecommendation.viabilityScore.dimensions.revenueViability}/10
                  </Text>
                </View>
                <View style={styles.dimensionItem}>
                  <Text style={styles.dimensionName}>Feasibility</Text>
                  <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.technicalFeasibility) }]}>
                    {killRecommendation.viabilityScore.dimensions.technicalFeasibility}/10
                  </Text>
                </View>
              </View>

              {/* Action */}
              <View style={{ width: '30%' }}>
                <View style={styles.actionBox}>
                  <Text style={styles.actionLabel}>Recommended Action</Text>
                  <Text style={[styles.actionValue, { color: getActionColor(killRecommendation.action) }]}>
                    {killRecommendation.action.toUpperCase()}
                  </Text>
                  <Text style={styles.actionSummary} numberOfLines={3}>
                    {killRecommendation.summary}
                  </Text>
                </View>
              </View>
            </View>

            {/* Critical Issues */}
            {killRecommendation.viabilityScore.criticalIssues.length > 0 && (
              <View style={styles.issuesList}>
                <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Critical Issues</Text>
                {killRecommendation.viabilityScore.criticalIssues.slice(0, 3).map((issue, idx) => (
                  <View key={idx} style={styles.issueItem}>
                    <Text style={styles.issueIcon}>!</Text>
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Lean Canvas v{canvas.metadata.version} | {canvas.metadata.pathway}
          </Text>
          <Text style={styles.footerText}>
            Generated with ThinkHaven
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
