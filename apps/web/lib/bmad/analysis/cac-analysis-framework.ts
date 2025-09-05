import { 
  BusinessModelPhaseData, 
  CustomerSegment, 
  RevenueStream 
} from '../templates/business-model-templates';

/**
 * Customer Acquisition Cost (CAC) Analysis Framework
 * Comprehensive analysis and optimization of customer acquisition costs across segments and channels
 */

export interface CACAnalysis {
  segmentId: string;
  segmentName: string;
  revenueStream: string;
  cacMetrics: CACMetrics;
  channelAnalysis: ChannelCACAnalysis[];
  cacBreakdown: CACBreakdown;
  efficiency: CACEfficiencyMetrics;
  benchmarks: CACBenchmarks;
  optimization: CACOptimization;
  recommendations: CACRecommendation[];
}

export interface CACMetrics {
  totalCAC: number;
  blendedCAC: number;
  organicCAC: number;
  paidCAC: number;
  salesCAC: number;
  marketingCAC: number;
  fullyLoadedCAC: number;
  marginalCAC: number;
}

export interface ChannelCACAnalysis {
  channelId: string;
  channelName: string;
  channelType: 'organic' | 'paid' | 'sales' | 'partnership' | 'referral';
  cac: number;
  volume: number;
  conversionRate: number;
  costPerLead: number;
  leadToCustomerRate: number;
  timeToConversion: number;
  quality: ChannelQuality;
  scalability: ChannelScalability;
}

export interface ChannelQuality {
  ltv: number;
  retentionRate: number;
  churnRate: number;
  qualityScore: number;
  engagementScore: number;
}

export interface ChannelScalability {
  currentVolume: number;
  maxVolume: number;
  scalabilityScore: number;
  constraints: string[];
  saturationPoint: number;
}

export interface CACBreakdown {
  salesPersonnel: number;
  marketingCampaigns: number;
  advertisingSpend: number;
  contentMarketing: number;
  events: number;
  tools: number;
  overhead: number;
  attribution: CACAttribution[];
}

export interface CACAttribution {
  touchpointType: string;
  attribution: 'first-touch' | 'last-touch' | 'multi-touch' | 'time-decay';
  weightedContribution: number;
  cost: number;
}

export interface CACEfficiencyMetrics {
  ltvcacRatio: number;
  paybackPeriod: number;
  roasRatio: number; // Return on Ad Spend
  magicNumber: number; // SaaS efficiency metric
  ruleOf40Score: number;
  monthsToRecoverCAC: number;
}

export interface CACBenchmarks {
  industryAverage: number;
  industryRange: NumberRange;
  segmentBenchmark: number;
  revenueStreamBenchmark: number;
  competitorEstimates: CompetitorCACEstimate[];
}

export interface NumberRange {
  min: number;
  max: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
}

export interface CompetitorCACEstimate {
  competitorName: string;
  estimatedCAC: number;
  confidence: 'low' | 'medium' | 'high';
  source: string;
  methodology: string;
}

export interface CACOptimization {
  currentEfficiency: number;
  potentialSavings: number;
  optimizationOpportunities: OptimizationOpportunity[];
  experimentRecommendations: CACExperiment[];
}

export interface OptimizationOpportunity {
  type: 'channel-mix' | 'conversion' | 'targeting' | 'creative' | 'process' | 'technology';
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  confidence: number;
}

export interface CACExperiment {
  experimentName: string;
  hypothesis: string;
  expectedImpact: number;
  testDuration: string;
  requiredBudget: number;
  successMetrics: string[];
}

export interface CACRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'channel-optimization' | 'process-improvement' | 'targeting' | 'budget-allocation';
  description: string;
  expectedCACReduction: number;
  expectedVolumeImpact: number;
  implementationCost: number;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CACTrend {
  period: string;
  cac: number;
  volume: number;
  efficiency: number;
  channelMix: ChannelMixData[];
}

export interface ChannelMixData {
  channel: string;
  percentage: number;
  cac: number;
  volume: number;
}

export interface CohortCACAnalysis {
  cohortPeriod: string;
  cohortSize: number;
  acquisitionCost: number;
  ltv: number;
  ltvcacRatio: number;
  paybackMonths: number;
  retentionCurve: number[];
}

/**
 * CAC Analysis Framework Engine
 */
export class CACAnalysisFramework {

  /**
   * Perform comprehensive CAC analysis for a customer segment
   */
  analyzeCACForSegment(
    segment: CustomerSegment,
    revenueStream: RevenueStream,
    marketingData?: MarketingChannelData[],
    historicalData?: HistoricalCACData[]
  ): CACAnalysis {
    // Calculate core CAC metrics
    const cacMetrics = this.calculateCACMetrics(segment, revenueStream, marketingData);
    
    // Analyze each acquisition channel
    const channelAnalysis = this.analyzeAcquisitionChannels(segment, marketingData);
    
    // Break down CAC by cost category
    const cacBreakdown = this.generateCACBreakdown(cacMetrics, marketingData);
    
    // Calculate efficiency metrics
    const efficiency = this.calculateEfficiencyMetrics(cacMetrics, segment, revenueStream);
    
    // Get industry benchmarks
    const benchmarks = this.getBenchmarks(segment, revenueStream);
    
    // Identify optimization opportunities
    const optimization = this.identifyOptimizationOpportunities(cacMetrics, channelAnalysis, benchmarks);
    
    // Generate recommendations
    const recommendations = this.generateCACRecommendations(cacMetrics, efficiency, optimization);

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      revenueStream: revenueStream.name,
      cacMetrics,
      channelAnalysis,
      cacBreakdown,
      efficiency,
      benchmarks,
      optimization,
      recommendations
    };
  }

  /**
   * Analyze CAC trends over time
   */
  analyzeCACTrends(
    segment: CustomerSegment,
    historicalData: HistoricalCACData[]
  ): CACTrend[] {
    return historicalData.map(data => ({
      period: data.period,
      cac: data.cac,
      volume: data.customerCount,
      efficiency: data.ltv / data.cac,
      channelMix: this.calculateChannelMix(data.channelSpend)
    }));
  }

  /**
   * Perform cohort-based CAC analysis
   */
  analyzeCohortCAC(
    cohortData: CohortAcquisitionData[]
  ): CohortCACAnalysis[] {
    return cohortData.map(cohort => ({
      cohortPeriod: cohort.period,
      cohortSize: cohort.customerCount,
      acquisitionCost: cohort.totalCost / cohort.customerCount,
      ltv: cohort.ltv,
      ltvcacRatio: cohort.ltv / (cohort.totalCost / cohort.customerCount),
      paybackMonths: this.calculatePaybackPeriod(cohort),
      retentionCurve: cohort.retentionByMonth
    }));
  }

  /**
   * Optimize channel mix for minimum CAC
   */
  optimizeChannelMix(
    channels: ChannelCACAnalysis[],
    targetVolume: number,
    constraints: ChannelConstraint[]
  ): OptimizedChannelMix {
    // Sort channels by CAC efficiency
    const sortedChannels = channels.sort((a, b) => a.cac - b.cac);
    
    let allocatedVolume = 0;
    const optimalMix: ChannelAllocation[] = [];
    let totalCost = 0;

    for (const channel of sortedChannels) {
      const constraint = constraints.find(c => c.channelId === channel.channelId);
      const maxVolumeForChannel = Math.min(
        channel.scalability.maxVolume,
        constraint?.maxVolume || Number.MAX_SAFE_INTEGER,
        targetVolume - allocatedVolume
      );

      if (maxVolumeForChannel > 0) {
        optimalMix.push({
          channelId: channel.channelId,
          channelName: channel.channelName,
          allocatedVolume: maxVolumeForChannel,
          allocatedBudget: maxVolumeForChannel * channel.cac,
          expectedCAC: channel.cac
        });
        
        totalCost += maxVolumeForChannel * channel.cac;
        allocatedVolume += maxVolumeForChannel;
        
        if (allocatedVolume >= targetVolume) break;
      }
    }

    const blendedCAC = allocatedVolume > 0 ? totalCost / allocatedVolume : 0;

    return {
      targetVolume,
      achievedVolume: allocatedVolume,
      blendedCAC,
      totalBudget: totalCost,
      channelAllocation: optimalMix,
      unallocatedVolume: Math.max(0, targetVolume - allocatedVolume)
    };
  }

  /**
   * Private calculation methods
   */
  private calculateCACMetrics(
    segment: CustomerSegment,
    revenueStream: RevenueStream,
    marketingData?: MarketingChannelData[]
  ): CACMetrics {
    // Parse acquisition cost from segment
    let totalCAC = 1000; // Default fallback
    
    if (segment.acquisitionCost) {
      const costString = segment.acquisitionCost.toLowerCase();
      if (costString.includes('k')) {
        totalCAC = parseFloat(costString.match(/[\d.]+/)?.[0] || '1') * 1000;
      } else {
        totalCAC = parseFloat(costString.match(/[\d.]+/)?.[0] || '1000');
      }
    }

    // Calculate different CAC types based on marketing data
    let paidCAC = totalCAC * 0.6; // 60% from paid channels
    let organicCAC = totalCAC * 0.2; // 20% from organic channels
    let salesCAC = totalCAC * 0.2; // 20% from sales efforts

    if (marketingData && marketingData.length > 0) {
      const totalSpend = marketingData.reduce((sum, channel) => sum + channel.cost, 0);
      const totalAcquisitions = marketingData.reduce((sum, channel) => sum + channel.acquisitions, 0);
      
      if (totalAcquisitions > 0) {
        totalCAC = totalSpend / totalAcquisitions;
        
        // Calculate by channel type
        const paidChannels = marketingData.filter(c => c.type === 'paid');
        const organicChannels = marketingData.filter(c => c.type === 'organic');
        const salesChannels = marketingData.filter(c => c.type === 'sales');
        
        paidCAC = this.calculateChannelCAC(paidChannels);
        organicCAC = this.calculateChannelCAC(organicChannels);
        salesCAC = this.calculateChannelCAC(salesChannels);
      }
    }

    const marketingCAC = (paidCAC + organicCAC) / 2;
    const blendedCAC = totalCAC;
    const fullyLoadedCAC = totalCAC * 1.4; // Add overhead and fully-loaded costs
    const marginalCAC = totalCAC * 1.1; // Marginal cost is slightly higher

    return {
      totalCAC,
      blendedCAC,
      organicCAC,
      paidCAC,
      salesCAC,
      marketingCAC,
      fullyLoadedCAC,
      marginalCAC
    };
  }

  private analyzeAcquisitionChannels(
    segment: CustomerSegment,
    marketingData?: MarketingChannelData[]
  ): ChannelCACAnalysis[] {
    if (!marketingData || marketingData.length === 0) {
      // Generate default channel analysis
      return this.generateDefaultChannelAnalysis(segment);
    }

    return marketingData.map(channel => ({
      channelId: channel.channelId,
      channelName: channel.channelName,
      channelType: channel.type,
      cac: channel.acquisitions > 0 ? channel.cost / channel.acquisitions : 0,
      volume: channel.acquisitions,
      conversionRate: channel.conversionRate,
      costPerLead: channel.leads > 0 ? channel.cost / channel.leads : 0,
      leadToCustomerRate: channel.leads > 0 ? channel.acquisitions / channel.leads : 0,
      timeToConversion: channel.avgConversionTime,
      quality: this.assessChannelQuality(channel, segment),
      scalability: this.assessChannelScalability(channel)
    }));
  }

  private generateDefaultChannelAnalysis(segment: CustomerSegment): ChannelCACAnalysis[] {
    // Generate typical channels based on segment characteristics
    const channels = [];

    // B2B segments typically use these channels
    if (segment.demographics.companySize || segment.demographics.industry) {
      channels.push({
        channelId: 'linkedin-ads',
        channelName: 'LinkedIn Advertising',
        channelType: 'paid' as const,
        cac: 500,
        volume: 20,
        conversionRate: 0.02,
        costPerLead: 25,
        leadToCustomerRate: 0.8,
        timeToConversion: 45,
        quality: { ltv: 2500, retentionRate: 0.8, churnRate: 0.2, qualityScore: 85, engagementScore: 80 },
        scalability: { currentVolume: 20, maxVolume: 200, scalabilityScore: 70, constraints: ['Budget dependent'], saturationPoint: 150 }
      });

      channels.push({
        channelId: 'direct-sales',
        channelName: 'Direct Sales Outreach',
        channelType: 'sales' as const,
        cac: 1200,
        volume: 15,
        conversionRate: 0.15,
        costPerLead: 180,
        leadToCustomerRate: 0.15,
        timeToConversion: 90,
        quality: { ltv: 5000, retentionRate: 0.9, churnRate: 0.1, qualityScore: 95, engagementScore: 90 },
        scalability: { currentVolume: 15, maxVolume: 50, scalabilityScore: 40, constraints: ['Sales team capacity'], saturationPoint: 40 }
      });
    }

    // B2C segments typically use these channels
    if (!segment.demographics.companySize) {
      channels.push({
        channelId: 'google-ads',
        channelName: 'Google Ads',
        channelType: 'paid' as const,
        cac: 150,
        volume: 100,
        conversionRate: 0.05,
        costPerLead: 7.5,
        leadToCustomerRate: 0.05,
        timeToConversion: 7,
        quality: { ltv: 800, retentionRate: 0.6, churnRate: 0.4, qualityScore: 65, engagementScore: 60 },
        scalability: { currentVolume: 100, maxVolume: 1000, scalabilityScore: 85, constraints: ['Market saturation'], saturationPoint: 800 }
      });

      channels.push({
        channelId: 'social-media',
        channelName: 'Social Media Marketing',
        channelType: 'organic' as const,
        cac: 80,
        volume: 150,
        conversionRate: 0.08,
        costPerLead: 6.4,
        leadToCustomerRate: 0.08,
        timeToConversion: 14,
        quality: { ltv: 600, retentionRate: 0.5, churnRate: 0.5, qualityScore: 55, engagementScore: 70 },
        scalability: { currentVolume: 150, maxVolume: 500, scalabilityScore: 60, constraints: ['Content creation capacity'], saturationPoint: 400 }
      });
    }

    // Always include referral channel
    channels.push({
      channelId: 'referrals',
      channelName: 'Customer Referrals',
      channelType: 'referral' as const,
      cac: 50,
      volume: 25,
      conversionRate: 0.25,
      costPerLead: 12.5,
      leadToCustomerRate: 0.25,
      timeToConversion: 21,
      quality: { ltv: 1500, retentionRate: 0.85, churnRate: 0.15, qualityScore: 90, engagementScore: 85 },
      scalability: { currentVolume: 25, maxVolume: 100, scalabilityScore: 50, constraints: ['Referral program effectiveness'], saturationPoint: 75 }
    });

    return channels;
  }

  private generateCACBreakdown(cacMetrics: CACMetrics, marketingData?: MarketingChannelData[]): CACBreakdown {
    const totalCAC = cacMetrics.totalCAC;
    
    // Default breakdown percentages
    const breakdown = {
      salesPersonnel: totalCAC * 0.35,
      marketingCampaigns: totalCAC * 0.25,
      advertisingSpend: totalCAC * 0.20,
      contentMarketing: totalCAC * 0.08,
      events: totalCAC * 0.05,
      tools: totalCAC * 0.04,
      overhead: totalCAC * 0.03,
      attribution: [
        {
          touchpointType: 'Initial awareness',
          attribution: 'first-touch' as const,
          weightedContribution: 0.3,
          cost: totalCAC * 0.3
        },
        {
          touchpointType: 'Consideration phase',
          attribution: 'multi-touch' as const,
          weightedContribution: 0.4,
          cost: totalCAC * 0.4
        },
        {
          touchpointType: 'Final conversion',
          attribution: 'last-touch' as const,
          weightedContribution: 0.3,
          cost: totalCAC * 0.3
        }
      ]
    };

    return breakdown;
  }

  private calculateEfficiencyMetrics(
    cacMetrics: CACMetrics,
    segment: CustomerSegment,
    revenueStream: RevenueStream
  ): CACEfficiencyMetrics {
    // Estimate LTV for this segment
    const estimatedLTV = this.estimateLTV(segment, revenueStream);
    
    const ltvcacRatio = estimatedLTV / cacMetrics.totalCAC;
    const paybackPeriod = this.calculatePaybackPeriod({
      totalCost: cacMetrics.totalCAC * 100,
      customerCount: 100,
      ltv: estimatedLTV,
      period: '2024-01',
      retentionByMonth: [1.0, 0.9, 0.85, 0.8, 0.75, 0.7] // Sample retention curve
    });
    
    // Estimate monthly revenue per customer
    const monthlyRevenue = estimatedLTV / 24; // Assume 24-month LTV period
    const roasRatio = monthlyRevenue * 12 / cacMetrics.marketingCAC; // Annual ROAS
    
    // SaaS Magic Number (quarterly recurring revenue growth / sales & marketing spend)
    const magicNumber = (monthlyRevenue * 3) / (cacMetrics.totalCAC / 4);
    
    // Rule of 40 (growth rate + profit margin) - simplified calculation
    const ruleOf40Score = 25; // Default 25% (15% growth + 10% margin)
    
    const monthsToRecoverCAC = cacMetrics.totalCAC / monthlyRevenue;

    return {
      ltvcacRatio,
      paybackPeriod,
      roasRatio,
      magicNumber,
      ruleOf40Score,
      monthsToRecoverCAC
    };
  }

  private getBenchmarks(segment: CustomerSegment, revenueStream: RevenueStream): CACBenchmarks {
    // Industry benchmarks based on revenue stream type
    const industryBenchmarks = {
      'subscription': { average: 300, min: 100, max: 800, p25: 150, p50: 300, p75: 500 },
      'marketplace': { average: 200, min: 50, max: 500, p25: 100, p50: 200, p75: 350 },
      'advertising': { average: 50, min: 10, max: 150, p25: 25, p50: 50, p75: 100 },
      'freemium': { average: 400, min: 100, max: 1000, p25: 200, p50: 400, p75: 700 },
      'one-time': { average: 250, min: 50, max: 600, p25: 125, p50: 250, p75: 400 },
      'commission': { average: 150, min: 30, max: 400, p25: 75, p50: 150, p75: 275 },
      'licensing': { average: 2000, min: 500, max: 5000, p25: 1000, p50: 2000, p75: 3500 }
    };

    const benchmark = industryBenchmarks[revenueStream.type] || industryBenchmarks['subscription'];

    return {
      industryAverage: benchmark.average,
      industryRange: {
        min: benchmark.min,
        max: benchmark.max,
        percentile25: benchmark.p25,
        percentile50: benchmark.p50,
        percentile75: benchmark.p75
      },
      segmentBenchmark: benchmark.average * (segment.size === 'large' ? 1.2 : segment.size === 'small' ? 0.8 : 1.0),
      revenueStreamBenchmark: benchmark.average,
      competitorEstimates: [
        {
          competitorName: 'Industry Leader',
          estimatedCAC: benchmark.p25,
          confidence: 'medium',
          source: 'Industry reports',
          methodology: 'Revenue multiple estimation'
        }
      ]
    };
  }

  private identifyOptimizationOpportunities(
    cacMetrics: CACMetrics,
    channelAnalysis: ChannelCACAnalysis[],
    benchmarks: CACBenchmarks
  ): CACOptimization {
    const opportunities: OptimizationOpportunity[] = [];
    let totalPotentialSavings = 0;

    // Channel mix optimization
    const highCACChannels = channelAnalysis.filter(channel => channel.cac > benchmarks.industryAverage);
    if (highCACChannels.length > 0) {
      const savings = highCACChannels.reduce((sum, channel) => 
        sum + (channel.cac - benchmarks.industryAverage) * channel.volume, 0);
      
      opportunities.push({
        type: 'channel-mix',
        description: `Optimize high-CAC channels (${highCACChannels.map(c => c.channelName).join(', ')})`,
        potentialSavings: savings,
        effort: 'medium',
        timeframe: '3-6 months',
        confidence: 0.7
      });
      
      totalPotentialSavings += savings;
    }

    // Conversion rate optimization
    const lowConversionChannels = channelAnalysis.filter(channel => channel.conversionRate < 0.05);
    if (lowConversionChannels.length > 0) {
      const conversionSavings = lowConversionChannels.reduce((sum, channel) => 
        sum + (channel.cac * 0.2 * channel.volume), 0); // 20% improvement assumption
      
      opportunities.push({
        type: 'conversion',
        description: 'Improve conversion rates through landing page and funnel optimization',
        potentialSavings: conversionSavings,
        effort: 'low',
        timeframe: '1-3 months',
        confidence: 0.8
      });
      
      totalPotentialSavings += conversionSavings;
    }

    // Process improvement
    if (cacMetrics.totalCAC > benchmarks.industryAverage * 1.2) {
      const processSavings = (cacMetrics.totalCAC - benchmarks.industryAverage) * 100; // Assume 100 acquisitions
      
      opportunities.push({
        type: 'process',
        description: 'Streamline acquisition process and reduce friction',
        potentialSavings: processSavings,
        effort: 'high',
        timeframe: '6-12 months',
        confidence: 0.6
      });
      
      totalPotentialSavings += processSavings;
    }

    // Generate experiments
    const experiments: CACExperiment[] = [
      {
        experimentName: 'Landing Page A/B Test',
        hypothesis: 'Improved landing page will increase conversion rate by 15%',
        expectedImpact: cacMetrics.totalCAC * 0.15,
        testDuration: '4 weeks',
        requiredBudget: 5000,
        successMetrics: ['Conversion rate', 'Cost per conversion', 'CAC reduction']
      },
      {
        experimentName: 'Channel Budget Reallocation',
        hypothesis: 'Shifting budget to lower CAC channels will reduce blended CAC',
        expectedImpact: totalPotentialSavings * 0.3,
        testDuration: '8 weeks',
        requiredBudget: 10000,
        successMetrics: ['Blended CAC', 'Total acquisitions', 'Channel performance']
      }
    ];

    const currentEfficiency = cacMetrics.totalCAC > 0 ? benchmarks.industryAverage / cacMetrics.totalCAC : 1;

    return {
      currentEfficiency,
      potentialSavings: totalPotentialSavings,
      optimizationOpportunities: opportunities,
      experimentRecommendations: experiments
    };
  }

  private generateCACRecommendations(
    cacMetrics: CACMetrics,
    efficiency: CACEfficiencyMetrics,
    optimization: CACOptimization
  ): CACRecommendation[] {
    const recommendations: CACRecommendation[] = [];

    // LTV:CAC ratio recommendation
    if (efficiency.ltvcacRatio < 3) {
      recommendations.push({
        priority: 'high',
        category: 'channel-optimization',
        description: 'Improve LTV:CAC ratio by focusing on higher-quality acquisition channels',
        expectedCACReduction: cacMetrics.totalCAC * 0.2,
        expectedVolumeImpact: 0.9, // Slight volume decrease for better quality
        implementationCost: 15000,
        timeframe: '3-6 months',
        riskLevel: 'medium'
      });
    }

    // Payback period recommendation
    if (efficiency.paybackPeriod > 12) {
      recommendations.push({
        priority: 'high',
        category: 'process-improvement',
        description: 'Reduce payback period by optimizing onboarding and time-to-value',
        expectedCACReduction: 0, // No CAC reduction, but faster payback
        expectedVolumeImpact: 1.0,
        implementationCost: 20000,
        timeframe: '6-9 months',
        riskLevel: 'low'
      });
    }

    // Channel diversification
    recommendations.push({
      priority: 'medium',
      category: 'channel-optimization',
      description: 'Diversify acquisition channels to reduce dependency and risk',
      expectedCACReduction: cacMetrics.totalCAC * 0.1,
      expectedVolumeImpact: 1.2, // Increase volume through diversification
      implementationCost: 25000,
      timeframe: '6-12 months',
      riskLevel: 'medium'
    });

    // Budget allocation optimization
    if (optimization.potentialSavings > cacMetrics.totalCAC * 0.15) {
      recommendations.push({
        priority: 'high',
        category: 'budget-allocation',
        description: 'Reallocate budget from high-CAC to low-CAC channels',
        expectedCACReduction: optimization.potentialSavings / 2, // Conservative estimate
        expectedVolumeImpact: 1.1,
        implementationCost: 5000,
        timeframe: '1-3 months',
        riskLevel: 'low'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Helper methods
   */
  private calculateChannelCAC(channels: MarketingChannelData[]): number {
    if (channels.length === 0) return 0;
    
    const totalCost = channels.reduce((sum, channel) => sum + channel.cost, 0);
    const totalAcquisitions = channels.reduce((sum, channel) => sum + channel.acquisitions, 0);
    
    return totalAcquisitions > 0 ? totalCost / totalAcquisitions : 0;
  }

  private assessChannelQuality(channel: MarketingChannelData, segment: CustomerSegment): ChannelQuality {
    // Estimate quality metrics based on channel type and segment
    const qualityMap = {
      'paid': { ltv: 1200, retention: 0.6, engagement: 65 },
      'organic': { ltv: 1800, retention: 0.75, engagement: 80 },
      'sales': { ltv: 2500, retention: 0.85, engagement: 90 },
      'referral': { ltv: 2000, retention: 0.8, engagement: 85 },
      'partnership': { ltv: 1500, retention: 0.7, engagement: 75 }
    };

    const quality = qualityMap[channel.type] || qualityMap['paid'];
    
    return {
      ltv: quality.ltv,
      retentionRate: quality.retention,
      churnRate: 1 - quality.retention,
      qualityScore: quality.engagement + 10,
      engagementScore: quality.engagement
    };
  }

  private assessChannelScalability(channel: MarketingChannelData): ChannelScalability {
    // Estimate scalability based on channel type
    const scalabilityMap = {
      'paid': { maxVolume: 1000, scalabilityScore: 80, constraints: ['Budget', 'Market saturation'] },
      'organic': { maxVolume: 500, scalabilityScore: 60, constraints: ['Content capacity', 'Time investment'] },
      'sales': { maxVolume: 100, scalabilityScore: 40, constraints: ['Team capacity', 'Skill requirements'] },
      'referral': { maxVolume: 200, scalabilityScore: 50, constraints: ['Customer base size', 'Program effectiveness'] },
      'partnership': { maxVolume: 300, scalabilityScore: 55, constraints: ['Partner capacity', 'Relationship quality'] }
    };

    const scalability = scalabilityMap[channel.type] || scalabilityMap['paid'];
    
    return {
      currentVolume: channel.acquisitions,
      maxVolume: scalability.maxVolume,
      scalabilityScore: scalability.scalabilityScore,
      constraints: scalability.constraints,
      saturationPoint: scalability.maxVolume * 0.8
    };
  }

  private calculatePaybackPeriod(cohort: CohortAcquisitionData): number {
    const cac = cohort.totalCost / cohort.customerCount;
    const monthlyRevenue = cohort.ltv / cohort.retentionByMonth.length;
    
    return cac / monthlyRevenue;
  }

  private calculateChannelMix(channelSpend: Record<string, number>): ChannelMixData[] {
    const totalSpend = Object.values(channelSpend).reduce((sum, spend) => sum + spend, 0);
    
    return Object.entries(channelSpend).map(([channel, spend]) => ({
      channel,
      percentage: spend / totalSpend,
      cac: spend / 10, // Simplified calculation
      volume: 10 // Simplified calculation
    }));
  }

  private estimateLTV(segment: CustomerSegment, revenueStream: RevenueStream): number {
    // Parse LTV from segment if available
    if (segment.lifetimeValue) {
      const ltvString = segment.lifetimeValue.toLowerCase();
      if (ltvString.includes('k')) {
        return parseFloat(ltvString.match(/[\d.]+/)?.[0] || '1') * 1000;
      } else if (ltvString.includes('m')) {
        return parseFloat(ltvString.match(/[\d.]+/)?.[0] || '1') * 1000000;
      } else {
        return parseFloat(ltvString.match(/[\d.]+/)?.[0] || '1000');
      }
    }

    // Estimate based on revenue stream type
    const ltvMap = {
      'subscription': 2400, // 24 months * $100/month
      'marketplace': 800,   // Multiple transactions
      'advertising': 300,   // Lower engagement model
      'freemium': 1800,     // Mix of free and paid
      'one-time': 500,      // Single transaction
      'commission': 1200,   // Multiple transactions with commission
      'licensing': 5000     // High-value enterprise deals
    };

    return ltvMap[revenueStream.type] || 1500;
  }
}

// Additional interfaces
export interface MarketingChannelData {
  channelId: string;
  channelName: string;
  type: 'organic' | 'paid' | 'sales' | 'partnership' | 'referral';
  cost: number;
  leads: number;
  acquisitions: number;
  conversionRate: number;
  avgConversionTime: number;
}

export interface HistoricalCACData {
  period: string;
  cac: number;
  ltv: number;
  customerCount: number;
  channelSpend: Record<string, number>;
}

export interface CohortAcquisitionData {
  period: string;
  customerCount: number;
  totalCost: number;
  ltv: number;
  retentionByMonth: number[];
}

export interface ChannelConstraint {
  channelId: string;
  maxVolume: number;
  maxBudget?: number;
}

export interface OptimizedChannelMix {
  targetVolume: number;
  achievedVolume: number;
  blendedCAC: number;
  totalBudget: number;
  channelAllocation: ChannelAllocation[];
  unallocatedVolume: number;
}

export interface ChannelAllocation {
  channelId: string;
  channelName: string;
  allocatedVolume: number;
  allocatedBudget: number;
  expectedCAC: number;
}

/**
 * Factory function to create CAC analysis framework
 */
export function createCACAnalysisFramework(): CACAnalysisFramework {
  return new CACAnalysisFramework();
}