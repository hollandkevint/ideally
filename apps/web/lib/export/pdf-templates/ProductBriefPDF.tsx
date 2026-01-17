/**
 * Product Brief PDF Template
 * Story 6.4: Professional PDF generation for Product Briefs with viability scoring
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ProductBrief } from '@/lib/bmad/generators/product-brief-generator';
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
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: `3px solid ${colors.terracotta}`,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 8,
  },
  meta: {
    fontSize: 10,
    color: colors.slateBlue,
    marginBottom: 4,
  },
  branding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandingText: {
    fontSize: 10,
    color: colors.terracotta,
    fontWeight: 'bold',
  },
  // Overview box
  overviewBox: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: colors.terracotta,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  description: {
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  stageBadge: {
    fontSize: 9,
    backgroundColor: colors.forest,
    color: '#FFFFFF',
    padding: '4px 8px',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 10,
    borderBottom: `1px solid ${colors.parchment}`,
    paddingBottom: 6,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.slateBlue,
    marginBottom: 6,
    marginTop: 12,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.ink,
    marginBottom: 6,
  },
  // List styles
  list: {
    marginLeft: 0,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  listBullet: {
    fontSize: 10,
    width: 16,
    color: colors.terracotta,
  },
  listText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 1.4,
    color: colors.ink,
  },
  // Table styles
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `1px solid ${colors.parchment}`,
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: colors.ink,
  },
  tableCellHeader: {
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.ink,
  },
  // Feature card
  featureCard: {
    backgroundColor: colors.cream,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 9,
    color: colors.slateBlue,
    lineHeight: 1.4,
  },
  priorityBadge: {
    fontSize: 7,
    padding: '2px 6px',
    borderRadius: 3,
    marginLeft: 8,
  },
  mustHave: {
    backgroundColor: colors.rust,
    color: '#FFFFFF',
  },
  shouldHave: {
    backgroundColor: colors.mustard,
    color: colors.ink,
  },
  niceToHave: {
    backgroundColor: colors.forest,
    color: '#FFFFFF',
  },
  // Risk severity
  riskHigh: { color: colors.rust },
  riskMedium: { color: colors.mustard },
  riskLow: { color: colors.forest },
  // Timeline
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelinePhase: {
    width: 100,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.forest,
  },
  timelineDuration: {
    width: 80,
    fontSize: 9,
    color: colors.slateBlue,
  },
  timelineDeliverables: {
    flex: 1,
  },
  // Viability section
  viabilitySection: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderLeft: `4px solid ${colors.terracotta}`,
  },
  viabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  viabilityScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.terracotta,
  },
  viabilityLabel: {
    fontSize: 10,
    color: colors.slateBlue,
    marginTop: 4,
  },
  actionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    width: '40%',
  },
  actionTitle: {
    fontSize: 9,
    color: colors.slateBlue,
    marginBottom: 4,
  },
  actionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  actionSummary: {
    fontSize: 9,
    color: colors.ink,
    lineHeight: 1.4,
  },
  dimensionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  dimensionItem: {
    width: '33%',
    marginBottom: 8,
  },
  dimensionName: {
    fontSize: 8,
    color: colors.slateBlue,
  },
  dimensionScore: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  criticalIssues: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    padding: 10,
  },
  issueTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.rust,
    marginBottom: 6,
  },
  issueItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  issueIcon: {
    fontSize: 8,
    color: colors.rust,
    marginRight: 6,
  },
  issueText: {
    fontSize: 8,
    color: colors.ink,
    flex: 1,
  },
  // Next steps
  nextSteps: {
    backgroundColor: colors.parchment,
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
  },
  nextStepsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `1px solid ${colors.parchment}`,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: colors.slateBlue,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: colors.slateBlue,
  },
  // Draft watermark
  draftWatermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    fontSize: 60,
    color: colors.parchment,
    opacity: 0.4,
    transform: 'rotate(-30deg)',
  },
});

interface ProductBriefPDFProps {
  brief: ProductBrief;
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

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'must-have': return styles.mustHave;
    case 'should-have': return styles.shouldHave;
    case 'nice-to-have': return styles.niceToHave;
    default: return styles.shouldHave;
  }
}

function getRiskStyle(severity: string) {
  switch (severity) {
    case 'high': return styles.riskHigh;
    case 'medium': return styles.riskMedium;
    case 'low': return styles.riskLow;
    default: return styles.riskMedium;
  }
}

export default function ProductBriefPDF({
  brief,
  killRecommendation,
  branding
}: ProductBriefPDFProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isDraft = brief.metadata.confidenceScore < 60;

  return (
    <Document>
      {/* Page 1: Overview and Problem */}
      <Page size="A4" style={styles.page}>
        {isDraft && <Text style={styles.draftWatermark}>DRAFT</Text>}

        {/* Branding */}
        <View style={styles.branding}>
          <Text style={styles.brandingText}>{branding?.companyName || 'ThinkHaven'}</Text>
          <Text style={styles.brandingText}>Product Brief</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{brief.title}</Text>
          <Text style={styles.meta}>
            Version {brief.version} | Created {formatDate(brief.createdDate)} | Confidence: {brief.metadata.confidenceScore}%
          </Text>
        </View>

        {/* Overview Box */}
        <View style={styles.overviewBox}>
          <Text style={styles.productName}>{brief.overview.productName}</Text>
          <Text style={styles.tagline}>{brief.overview.tagline}</Text>
          <Text style={styles.description}>{brief.overview.description}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={styles.stageBadge}>{brief.overview.stage.toUpperCase()}</Text>
            <Text style={[styles.stageBadge, { backgroundColor: colors.slateBlue }]}>{brief.overview.category}</Text>
          </View>
        </View>

        {/* Problem Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problem Statement</Text>

          <Text style={styles.subsectionTitle}>Core Problems</Text>
          <View style={styles.list}>
            {brief.problemStatement.coreProblems.map((problem, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>-</Text>
                <Text style={styles.listText}>{problem}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subsectionTitle}>Impact</Text>
          <Text style={styles.text}>{brief.problemStatement.impact}</Text>

          <Text style={styles.subsectionTitle}>Current Alternatives</Text>
          <View style={styles.list}>
            {brief.problemStatement.currentAlternatives.map((alt, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>-</Text>
                <Text style={styles.listText}>{alt}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subsectionTitle}>Why Now</Text>
          <Text style={styles.text}>{brief.problemStatement.whyNow}</Text>
        </View>

        {/* Target Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Users</Text>
          {brief.targetUsers.map((user, idx) => (
            <View key={idx} style={{ marginBottom: 12 }}>
              <Text style={styles.subsectionTitle}>
                {user.persona} ({user.priority})
              </Text>
              <Text style={styles.text}>{user.description}</Text>
              {user.painPoints.length > 0 && (
                <>
                  <Text style={[styles.text, { fontWeight: 'bold', marginTop: 4 }]}>Pain Points:</Text>
                  <View style={styles.list}>
                    {user.painPoints.map((pain, pidx) => (
                      <View key={pidx} style={styles.listItem}>
                        <Text style={styles.listBullet}>-</Text>
                        <Text style={styles.listText}>{pain}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated with ThinkHaven</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 2: Solution and Features */}
      <Page size="A4" style={styles.page}>
        {isDraft && <Text style={styles.draftWatermark}>DRAFT</Text>}

        {/* Proposed Solution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proposed Solution</Text>

          <Text style={styles.subsectionTitle}>Core Concept</Text>
          <Text style={styles.text}>{brief.proposedSolution.coreConcept}</Text>

          <Text style={styles.subsectionTitle}>Unique Value</Text>
          <Text style={styles.text}>{brief.proposedSolution.uniqueValue}</Text>

          <Text style={styles.subsectionTitle}>Key Differentiators</Text>
          <View style={styles.list}>
            {brief.proposedSolution.differentiators.map((diff, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>-</Text>
                <Text style={styles.listText}>{diff}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {brief.proposedSolution.keyFeatures.slice(0, 6).map((feature, idx) => (
            <View key={idx} style={styles.featureCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={[styles.priorityBadge, getPriorityStyle(feature.priority)]}>
                  {feature.priority}
                </Text>
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        {/* Success Criteria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Success Criteria</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { width: '40%' }]}>Metric</Text>
              <Text style={[styles.tableCellHeader, { width: '30%' }]}>Target</Text>
              <Text style={[styles.tableCellHeader, { width: '30%' }]}>Timeline</Text>
            </View>
            {brief.successCriteria.map((criterion, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{criterion.metric}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{criterion.target}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{criterion.timeline}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated with ThinkHaven</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 3: Risks, Timeline, and Viability */}
      <Page size="A4" style={styles.page}>
        {isDraft && <Text style={styles.draftWatermark}>DRAFT</Text>}

        {/* Risks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risks & Mitigations</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { width: '40%' }]}>Risk</Text>
              <Text style={[styles.tableCellHeader, { width: '15%' }]}>Severity</Text>
              <Text style={[styles.tableCellHeader, { width: '45%' }]}>Mitigation</Text>
            </View>
            {brief.risks.map((risk, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{risk.description}</Text>
                <Text style={[styles.tableCell, { width: '15%' }, getRiskStyle(risk.severity)]}>
                  {risk.severity.toUpperCase()}
                </Text>
                <Text style={[styles.tableCell, { width: '45%' }]}>{risk.mitigation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        {brief.timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {brief.timeline.map((phase, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <Text style={styles.timelinePhase}>{phase.phase}</Text>
                <Text style={styles.timelineDuration}>{phase.duration}</Text>
                <View style={styles.timelineDeliverables}>
                  {phase.deliverables.map((d, didx) => (
                    <Text key={didx} style={[styles.listText, { marginBottom: 2 }]}>- {d}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Viability Assessment */}
        {killRecommendation && (
          <View style={styles.viabilitySection}>
            <Text style={[styles.sectionTitle, { border: 'none', marginBottom: 12 }]}>
              Viability Assessment
            </Text>

            <View style={styles.viabilityHeader}>
              {/* Score */}
              <View>
                <Text style={styles.viabilityScore}>
                  {killRecommendation.viabilityScore.overall}/10
                </Text>
                <Text style={styles.viabilityLabel}>Overall Viability Score</Text>
              </View>

              {/* Action */}
              <View style={styles.actionBox}>
                <Text style={styles.actionTitle}>Recommended Action</Text>
                <Text style={[styles.actionValue, { color: getActionColor(killRecommendation.action) }]}>
                  {killRecommendation.action.toUpperCase()}
                </Text>
                <Text style={styles.actionSummary}>{killRecommendation.summary}</Text>
              </View>
            </View>

            {/* Dimension Grid */}
            <View style={styles.dimensionGrid}>
              <View style={styles.dimensionItem}>
                <Text style={styles.dimensionName}>Problem Clarity</Text>
                <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.problemClarity) }]}>
                  {killRecommendation.viabilityScore.dimensions.problemClarity}/10
                </Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={styles.dimensionName}>Target User Clarity</Text>
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
                <Text style={styles.dimensionName}>Revenue Viability</Text>
                <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.revenueViability) }]}>
                  {killRecommendation.viabilityScore.dimensions.revenueViability}/10
                </Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={styles.dimensionName}>Technical Feasibility</Text>
                <Text style={[styles.dimensionScore, { color: getScoreColor(killRecommendation.viabilityScore.dimensions.technicalFeasibility) }]}>
                  {killRecommendation.viabilityScore.dimensions.technicalFeasibility}/10
                </Text>
              </View>
            </View>

            {/* Critical Issues */}
            {killRecommendation.viabilityScore.criticalIssues.length > 0 && (
              <View style={styles.criticalIssues}>
                <Text style={styles.issueTitle}>Critical Issues to Address</Text>
                {killRecommendation.viabilityScore.criticalIssues.map((issue, idx) => (
                  <View key={idx} style={styles.issueItem}>
                    <Text style={styles.issueIcon}>!</Text>
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Next Steps */}
            {killRecommendation.improvements.length > 0 && (
              <View style={styles.nextSteps}>
                <Text style={styles.nextStepsTitle}>
                  {killRecommendation.action === 'kill' ? 'If You Proceed Anyway' : 'Recommended Next Steps'}
                </Text>
                {killRecommendation.improvements.slice(0, 4).map((step, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.listBullet}>{idx + 1}.</Text>
                    <Text style={styles.listText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated with ThinkHaven | {brief.metadata.sourceMessages} messages analyzed
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
