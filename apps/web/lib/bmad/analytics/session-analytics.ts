import { PathwayType } from '../types';
import { UniversalSessionState, SessionAnalytics } from '../session/universal-state-manager';

/**
 * Session metrics and tracking data
 */
export interface SessionMetrics {
  sessionId: string;
  userId: string;
  workspaceId: string;

  // Timing metrics
  totalDuration: number; // milliseconds
  pathwayDurations: { [pathway: string]: number };
  phaseDurations: { [phase: string]: number };
  averagePhaseTime: number;

  // Engagement metrics
  userInteractions: number;
  elicitationResponses: number;
  pathwaySwitches: number;
  sessionPauses: number;
  sessionResumes: number;

  // Completion metrics
  overallCompletion: number;
  pathwayCompletions: { [pathway: string]: number };
  phaseCompletions: { [phase: string]: number };
  completionRate: number;

  // Quality metrics
  insightsGenerated: number;
  documentsCreated: number;
  actionItemsCreated: number;
  userSatisfactionScore?: number;

  // Behavioral patterns
  preferredPathways: PathwayType[];
  commonPhaseTransitions: string[];
  averageResponseTime: number;
  sessionPattern: 'focused' | 'exploratory' | 'iterative';
}

/**
 * Real-time analytics data
 */
export interface RealTimeAnalytics {
  activeUsers: number;
  activeSessions: number;
  averageSessionDuration: number;
  popularPathways: { pathway: PathwayType; count: number }[];
  completionRates: { [pathway: string]: number };
  userEngagementScore: number;
}

/**
 * Pathway effectiveness metrics
 */
export interface PathwayEffectiveness {
  pathway: PathwayType;
  totalSessions: number;
  completionRate: number;
  averageDuration: number;
  userSatisfaction: number;
  commonExitPoints: string[];
  successFactors: string[];
  improvementAreas: string[];
}

/**
 * Session Analytics Engine
 * Tracks, analyzes, and provides insights on BMAD session data
 */
export class SessionAnalyticsEngine {
  private metricsCache = new Map<string, SessionMetrics>();
  private realtimeData: RealTimeAnalytics;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.realtimeData = this.initializeRealtimeData();
    this.startRealtimeUpdates();
  }

  /**
   * Start session tracking
   */
  async startSessionTracking(sessionId: string, state: UniversalSessionState): Promise<void> {
    const metrics: SessionMetrics = {
      sessionId,
      userId: state.sessionId, // Note: may need to extract actual userId
      workspaceId: '', // Extract from session data

      // Initialize timing
      totalDuration: 0,
      pathwayDurations: { [state.currentPathway]: 0 },
      phaseDurations: {},
      averagePhaseTime: 0,

      // Initialize engagement
      userInteractions: 0,
      elicitationResponses: 0,
      pathwaySwitches: state.pathwayHistory.length,
      sessionPauses: 0,
      sessionResumes: 0,

      // Initialize completion
      overallCompletion: state.globalProgress.overallCompletion,
      pathwayCompletions: state.globalProgress.pathwayCompletions,
      phaseCompletions: {},
      completionRate: state.globalProgress.overallCompletion / 100,

      // Initialize quality
      insightsGenerated: state.sharedContext.keyInsights.length,
      documentsCreated: state.sharedContext.generatedDocuments.length,
      actionItemsCreated: 0,

      // Initialize behavior
      preferredPathways: this.extractPreferredPathways(state),
      commonPhaseTransitions: [],
      averageResponseTime: 0,
      sessionPattern: this.determineSessionPattern(state)
    };

    this.metricsCache.set(sessionId, metrics);
    await this.saveMetricsToDatabase(metrics);
  }

  /**
   * Update session metrics
   */
  async updateSessionMetrics(sessionId: string, updateData: Partial<SessionMetrics>): Promise<void> {
    const currentMetrics = this.metricsCache.get(sessionId);
    if (!currentMetrics) {
      throw new Error(`Session ${sessionId} not found in analytics`);
    }

    const updatedMetrics = { ...currentMetrics, ...updateData };
    this.metricsCache.set(sessionId, updatedMetrics);

    // Update analytics data
    updatedMetrics.analytics = this.calculateSessionAnalytics(updatedMetrics);

    await this.saveMetricsToDatabase(updatedMetrics);
    this.updateRealtimeData();
  }

  /**
   * Track pathway switch event
   */
  async trackPathwaySwitch(
    sessionId: string,
    fromPathway: PathwayType,
    toPathway: PathwayType,
    reason: string
  ): Promise<void> {
    const metrics = this.metricsCache.get(sessionId);
    if (!metrics) return;

    metrics.pathwaySwitches++;
    metrics.userInteractions++;

    // Update pathway durations
    const currentTime = Date.now();
    if (metrics.pathwayDurations[fromPathway] === undefined) {
      metrics.pathwayDurations[fromPathway] = 0;
    }
    if (metrics.pathwayDurations[toPathway] === undefined) {
      metrics.pathwayDurations[toPathway] = 0;
    }

    await this.updateSessionMetrics(sessionId, metrics);

    // Track switch pattern
    await this.trackBehaviorPattern(sessionId, 'pathway_switch', {
      fromPathway,
      toPathway,
      reason,
      timestamp: new Date()
    });
  }

  /**
   * Track user interaction
   */
  async trackUserInteraction(
    sessionId: string,
    interactionType: string,
    interactionData: Record<string, unknown>,
    responseTime?: number
  ): Promise<void> {
    const metrics = this.metricsCache.get(sessionId);
    if (!metrics) return;

    metrics.userInteractions++;

    if (interactionType === 'elicitation_response') {
      metrics.elicitationResponses++;
    }

    if (responseTime) {
      // Update average response time
      const totalResponseTime = metrics.averageResponseTime * metrics.userInteractions;
      metrics.averageResponseTime = (totalResponseTime + responseTime) / (metrics.userInteractions + 1);
    }

    await this.updateSessionMetrics(sessionId, metrics);
  }

  /**
   * Track session pause/resume
   */
  async trackSessionState(sessionId: string, state: 'paused' | 'resumed'): Promise<void> {
    const metrics = this.metricsCache.get(sessionId);
    if (!metrics) return;

    if (state === 'paused') {
      metrics.sessionPauses++;
    } else {
      metrics.sessionResumes++;
    }

    await this.updateSessionMetrics(sessionId, metrics);
  }

  /**
   * Track phase completion
   */
  async trackPhaseCompletion(
    sessionId: string,
    phaseId: string,
    duration: number,
    completionQuality: number
  ): Promise<void> {
    const metrics = this.metricsCache.get(sessionId);
    if (!metrics) return;

    metrics.phaseCompletions[phaseId] = completionQuality;
    metrics.phaseDurations[phaseId] = duration;

    // Recalculate average phase time
    const totalPhaseTime = Object.values(metrics.phaseDurations).reduce((sum, time) => sum + time, 0);
    const phaseCount = Object.keys(metrics.phaseDurations).length;
    metrics.averagePhaseTime = phaseCount > 0 ? totalPhaseTime / phaseCount : 0;

    await this.updateSessionMetrics(sessionId, metrics);
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionMetrics | null> {
    return this.metricsCache.get(sessionId) || null;
  }

  /**
   * Get pathway effectiveness analysis
   */
  async getPathwayEffectiveness(pathway: PathwayType): Promise<PathwayEffectiveness> {
    const allMetrics = Array.from(this.metricsCache.values());
    const pathwayMetrics = allMetrics.filter(m =>
      m.preferredPathways.includes(pathway) ||
      m.pathwayCompletions[pathway] !== undefined
    );

    if (pathwayMetrics.length === 0) {
      return this.createEmptyPathwayEffectiveness(pathway);
    }

    const totalSessions = pathwayMetrics.length;
    const completedSessions = pathwayMetrics.filter(m =>
      (m.pathwayCompletions[pathway] || 0) > 80
    ).length;

    const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

    const averageDuration = pathwayMetrics.reduce((sum, m) =>
      sum + (m.pathwayDurations[pathway] || 0), 0
    ) / totalSessions;

    const userSatisfaction = pathwayMetrics.reduce((sum, m) =>
      sum + (m.userSatisfactionScore || 0), 0
    ) / totalSessions;

    return {
      pathway,
      totalSessions,
      completionRate,
      averageDuration,
      userSatisfaction,
      commonExitPoints: this.identifyCommonExitPoints(pathwayMetrics, pathway),
      successFactors: this.identifySuccessFactors(pathwayMetrics, pathway),
      improvementAreas: this.identifyImprovementAreas(pathwayMetrics, pathway)
    };
  }

  /**
   * Get realtime analytics
   */
  getRealtimeAnalytics(): RealTimeAnalytics {
    return { ...this.realtimeData };
  }

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(
    userId?: string,
    workspaceId?: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<{
    sessionMetrics: SessionMetrics[];
    pathwayEffectiveness: PathwayEffectiveness[];
    realtimeData: RealTimeAnalytics;
    insights: string[];
  }> {
    let filteredMetrics = Array.from(this.metricsCache.values());

    // Apply filters
    if (userId) {
      filteredMetrics = filteredMetrics.filter(m => m.userId === userId);
    }
    if (workspaceId) {
      filteredMetrics = filteredMetrics.filter(m => m.workspaceId === workspaceId);
    }

    // Get pathway effectiveness for each pathway
    const pathwayEffectiveness = await Promise.all(
      Object.values(PathwayType).map(pathway => this.getPathwayEffectiveness(pathway))
    );

    // Generate insights
    const insights = this.generateInsights(filteredMetrics, pathwayEffectiveness);

    return {
      sessionMetrics: filteredMetrics,
      pathwayEffectiveness,
      realtimeData: this.realtimeData,
      insights
    };
  }

  // Private helper methods

  private calculateSessionAnalytics(metrics: SessionMetrics): SessionAnalytics {
    return {
      pathwaySwitches: metrics.pathwaySwitches,
      completionRate: metrics.completionRate,
      userBehaviorPatterns: {
        sessionPattern: metrics.sessionPattern,
        preferredPathways: metrics.preferredPathways,
        averageResponseTime: metrics.averageResponseTime,
        interactionIntensity: metrics.userInteractions / (metrics.totalDuration / 60000) // interactions per minute
      },
      effectivenessMetrics: {
        insightsPerMinute: metrics.insightsGenerated / (metrics.totalDuration / 60000),
        completionEfficiency: metrics.overallCompletion / (metrics.totalDuration / 60000),
        engagementScore: this.calculateEngagementScore(metrics)
      }
    };
  }

  private calculateEngagementScore(metrics: SessionMetrics): number {
    let score = 0;

    // Base engagement from interactions
    score += Math.min(metrics.userInteractions * 2, 50);

    // Bonus for completion
    score += metrics.overallCompletion * 0.3;

    // Bonus for insights generated
    score += metrics.insightsGenerated * 5;

    // Penalty for excessive switches
    if (metrics.pathwaySwitches > 3) {
      score -= (metrics.pathwaySwitches - 3) * 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private extractPreferredPathways(state: UniversalSessionState): PathwayType[] {
    const pathways = [state.currentPathway];
    state.pathwayHistory.forEach(transition => {
      if (transition.fromPathway && !pathways.includes(transition.fromPathway)) {
        pathways.push(transition.fromPathway);
      }
    });
    return pathways;
  }

  private determineSessionPattern(state: UniversalSessionState): 'focused' | 'exploratory' | 'iterative' {
    const switchCount = state.pathwayHistory.length;

    if (switchCount === 0) return 'focused';
    if (switchCount <= 2) return 'exploratory';
    return 'iterative';
  }

  private async trackBehaviorPattern(
    sessionId: string,
    patternType: string,
    patternData: Record<string, unknown>
  ): Promise<void> {
    // Implement behavior pattern tracking logic
    // This could feed into machine learning models for recommendation improvement
  }

  private async saveMetricsToDatabase(metrics: SessionMetrics): Promise<void> {
    // Implement database persistence
    // This would save to the bmad_session_analytics table defined in Story 2.5
  }

  private updateRealtimeData(): void {
    const allMetrics = Array.from(this.metricsCache.values());

    this.realtimeData.activeSessions = allMetrics.length;
    this.realtimeData.averageSessionDuration = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.totalDuration, 0) / allMetrics.length
      : 0;

    // Update popular pathways
    const pathwayCount = new Map<PathwayType, number>();
    allMetrics.forEach(metrics => {
      metrics.preferredPathways.forEach(pathway => {
        pathwayCount.set(pathway, (pathwayCount.get(pathway) || 0) + 1);
      });
    });

    this.realtimeData.popularPathways = Array.from(pathwayCount.entries())
      .map(([pathway, count]) => ({ pathway, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate user engagement score
    this.realtimeData.userEngagementScore = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + this.calculateEngagementScore(m), 0) / allMetrics.length
      : 0;
  }

  private startRealtimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateRealtimeData();
    }, 30000); // Update every 30 seconds
  }

  private initializeRealtimeData(): RealTimeAnalytics {
    return {
      activeUsers: 0,
      activeSessions: 0,
      averageSessionDuration: 0,
      popularPathways: [],
      completionRates: {},
      userEngagementScore: 0
    };
  }

  private createEmptyPathwayEffectiveness(pathway: PathwayType): PathwayEffectiveness {
    return {
      pathway,
      totalSessions: 0,
      completionRate: 0,
      averageDuration: 0,
      userSatisfaction: 0,
      commonExitPoints: [],
      successFactors: [],
      improvementAreas: []
    };
  }

  private identifyCommonExitPoints(metrics: SessionMetrics[], pathway: PathwayType): string[] {
    // Analyze where users commonly exit in this pathway
    return ['phase_1', 'phase_3']; // Placeholder implementation
  }

  private identifySuccessFactors(metrics: SessionMetrics[], pathway: PathwayType): string[] {
    const highPerformingSessions = metrics.filter(m => (m.pathwayCompletions[pathway] || 0) > 80);
    // Analyze what leads to successful completions
    return ['early_engagement', 'consistent_interaction']; // Placeholder implementation
  }

  private identifyImprovementAreas(metrics: SessionMetrics[], pathway: PathwayType): string[] {
    // Analyze patterns in incomplete sessions
    return ['phase_transitions', 'user_guidance']; // Placeholder implementation
  }

  private generateInsights(
    metrics: SessionMetrics[],
    effectiveness: PathwayEffectiveness[]
  ): string[] {
    const insights: string[] = [];

    // Generate data-driven insights
    if (metrics.length > 0) {
      const avgCompletion = metrics.reduce((sum, m) => sum + m.overallCompletion, 0) / metrics.length;
      insights.push(`Average session completion rate: ${avgCompletion.toFixed(1)}%`);

      const mostPopularPathway = effectiveness.reduce((max, current) =>
        current.totalSessions > max.totalSessions ? current : max
      );
      insights.push(`Most popular pathway: ${mostPopularPathway.pathway}`);
    }

    return insights;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.metricsCache.clear();
  }
}

// Export singleton instance
export const sessionAnalyticsEngine = new SessionAnalyticsEngine();