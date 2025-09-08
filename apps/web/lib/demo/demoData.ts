import { DemoScenario } from '../../types/demo'

// Demo conversation data extracted from seed-demo-data.js
export const demoScenarios: DemoScenario[] = [
  {
    name: "AnalyticsPro - Market Entry Strategy",
    description: "B2B SaaS product launch strategy with competitive analysis and market positioning",
    chat_context: [
      {
        id: "msg-1",
        role: "user",
        content: "I'm launching AnalyticsPro, a B2B analytics tool for mid-market companies. Help me develop a go-to-market strategy.",
        timestamp: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: "msg-2", 
        role: "assistant",
        content: `Excellent! Let's approach this systematically using market-first strategic analysis. I need to understand your foundation first:

**Choose your primary focus:**
1. **Market Sizing & Opportunity Analysis** - Quantify your addressable market
2. **Competitive Landscape Deep Dive** - Understand positioning vs. competitors  
3. **Customer Persona & Validation** - Define and validate your ideal customer profile
4. **Pricing Strategy Framework** - Determine optimal pricing model

Which area feels most critical for your launch success?`,
        timestamp: new Date(Date.now() - 580000).toISOString(),
        metadata: {
          strategic_tags: ["market-analysis", "go-to-market", "strategy-planning"]
        }
      },
      {
        id: "msg-3",
        role: "user", 
        content: "Let's start with competitive landscape - I need to understand how to differentiate.",
        timestamp: new Date(Date.now() - 560000).toISOString()
      },
      {
        id: "msg-4",
        role: "assistant",
        content: `Perfect choice! Competitive analysis will inform all other strategic decisions. Let me guide you through systematic competitive intelligence:

**BMad Competitive Analysis Framework:**

**Phase 1: Competitive Mapping**
I've identified 3 competitor tiers to analyze:
- **Direct competitors:** Tableau, Power BI, Looker (enterprise focus)
- **Indirect competitors:** Google Analytics, Mixpanel (different scope) 
- **Emerging competitors:** Metabase, Grafana (open-source angle)

**Phase 2: Differentiation Matrix**
Key vectors to analyze:
1. **Target Market Size** (SMB vs Enterprise)
2. **Implementation Complexity** (Self-serve vs Consulting)
3. **Pricing Model** (Per-seat vs Usage-based)
4. **Integration Depth** (Surface vs Deep workflow integration)

**Your Strategic Questions:**
- What's your technical differentiation beyond "better analytics"?
- How does your 15-minute setup time compare to Tableau's 2-week implementation?
- What specific pain points do mid-market companies have that enterprise tools don't address?

Which competitive vector should we dive into first?`,
        timestamp: new Date(Date.now() - 540000).toISOString(),
        metadata: {
          strategic_tags: ["competitive-analysis", "market-positioning", "differentiation"]
        }
      },
      {
        id: "msg-5",
        role: "user",
        content: "The mid-market pain point analysis - that's exactly what I need to articulate.",
        timestamp: new Date(Date.now() - 520000).toISOString()
      },
      {
        id: "msg-6",
        role: "assistant", 
        content: `Brilliant strategic intuition! Mid-market is underserved by both enterprise complexity and SMB simplicity. Let me walk you through structured pain point discovery:

**Mid-Market Analytics Pain Points (Research-Based):**

**😤 Current Pain Points:**
1. **Enterprise tools are overkill** - Companies pay $50K+ for features they don't need
2. **SMB tools lack depth** - Can't handle complex data modeling as companies scale
3. **Implementation nightmare** - 6-month setups kill momentum
4. **Training bottleneck** - Teams can't get value without extensive training

**💡 Your Opportunity Areas:**
1. **"Goldilocks Complexity"** - Sophisticated enough for growth, simple enough to deploy
2. **"Time-to-Value Speed"** - 15-minute setup vs 2-week implementations  
3. **"Growth-Compatible Pricing"** - Usage-based vs huge upfront enterprise commitments
4. **"Self-Serve Intelligence"** - No-training-required insights vs consultant dependency

**Evidence-Based Validation:**
- Mid-market companies (50-500 employees) represent 35% of analytics spend but get 12% of product attention
- Average time-to-first-insight: Enterprise tools = 45 days, Your tool = 15 minutes
- Price sensitivity: 73% of mid-market companies reject solutions >$25K annually

**Next Strategic Question:**
How do we turn these pain points into a differentiation story that investors and customers immediately understand?`,
        timestamp: new Date(Date.now() - 500000).toISOString(),
        metadata: {
          strategic_tags: ["pain-point-analysis", "market-opportunity", "value-proposition"]
        }
      }
    ]
  },
  {
    name: "Fintech Startup - Competitive Analysis", 
    description: "Deep competitive intelligence for B2B payments startup competing with Stripe",
    chat_context: [
      {
        id: "msg-1",
        role: "user",
        content: "I need to do competitive intelligence for our fintech startup. We're in the B2B payments space competing with Stripe.",
        timestamp: new Date(Date.now() - 400000).toISOString()
      },
      {
        id: "msg-2",
        role: "assistant",
        content: `Strategic competitive intelligence requires systematic methodology, not just feature comparison. Let me guide you through evidence-based competitive analysis:

**BMad Competitive Intelligence Framework:**

**1. Market Position Mapping**
Let's first understand the competitive landscape structure:

**Direct Competitors (Same market, same solution):**
- Stripe, Square, PayPal Business
- Fighting for same customers with similar value props

**Indirect Competitors (Same problem, different approach):**
- Traditional merchant services, bank payment rails
- Lower friction but different user experience  

**Future Competitors (Emerging threats):**
- Embedded fintech (Plaid, Dwolla), crypto payment rails
- Could disrupt entire category

**Strategic Question:** Which competitive tier poses the biggest threat to your growth in next 18 months?

**2. Competitive Intelligence Vectors**
Choose your analysis depth:
1. **Product Feature Analysis** - Feature parity and gaps
2. **Market Strategy Intelligence** - Pricing, partnerships, customer acquisition  
3. **Technology Differentiation** - API performance, developer experience
4. **Financial Performance** - Revenue models, growth rates, funding

Where should we focus our intelligence gathering?`,
        timestamp: new Date(Date.now() - 380000).toISOString(),
        metadata: {
          strategic_tags: ["competitive-intelligence", "fintech", "market-analysis"]
        }
      },
      {
        id: "msg-3",
        role: "user",
        content: "Market strategy intelligence - I need to understand how they acquire customers and their pricing strategies.",
        timestamp: new Date(Date.now() - 360000).toISOString()
      },
      {
        id: "msg-4",
        role: "assistant",
        content: `Excellent choice! Market strategy intelligence reveals competitive moats and opportunities. Let me walk you through systematic market intelligence:

**Stripe's Market Strategy Deconstruction:**

**Customer Acquisition Engine:**
1. **Developer-First Growth:**
   - 850K+ developers using Stripe APIs
   - Documentation quality drives organic growth
   - GitHub integration creates workflow stickiness

2. **Platform Partnership Strategy:**
   - Shopify, WooCommerce native integrations
   - Marketplace revenue sharing models  
   - 3rd party ecosystem creates switching costs

3. **Enterprise Expansion:**
   - Started SMB, now moving upmarket to enterprise
   - Custom pricing for >$1M annual volume
   - White-glove onboarding for large accounts

**Pricing Strategy Analysis:**
- **Transaction Model:** 2.9% + $0.30 per transaction (transparent)
- **Volume Discounting:** Custom rates for high-volume (opaque)  
- **Value-Based Additions:** Radar fraud detection, billing products
- **Geographic Pricing:** Different rates by region/risk profile

**Strategic Opportunities I'm Seeing:**
1. **Mid-market gap:** Stripe optimizes for SMB and Enterprise, less focus on growing mid-market
2. **Vertical specialization:** Generic approach vs. industry-specific payment flows
3. **Geographic expansion:** Slower international expansion in certain regions
4. **Developer complexity:** Powerful but complex - opportunity for simpler implementation

**Key Strategic Questions:**
- What's your unfair advantage against Stripe's developer ecosystem?
- Which customer segment do you serve better than Stripe?
- How do you compete on price without race-to-bottom dynamics?`,
        timestamp: new Date(Date.now() - 340000).toISOString(),
        metadata: {
          strategic_tags: ["market-strategy", "customer-acquisition", "pricing-analysis", "competitive-moats"]
        }
      }
    ]
  },
  {
    name: "New Business Model Exploration",
    description: "Strategic brainstorming session for business model innovation and product-ization opportunities",
    chat_context: [
      {
        id: "msg-1", 
        role: "user",
        content: "I want to brainstorm new business model opportunities for my existing consulting business.",
        timestamp: new Date(Date.now() - 200000).toISOString()
      },
      {
        id: "msg-2",
        role: "assistant",
        content: `Strategic brainstorming requires structured creativity! Let me facilitate a systematic exploration of business model innovation. 

**BMad Brainstorming Protocol:**

**Phase 1: Current State Analysis**
First, let's map your current business model foundation:

**Your Current Consulting Model (Assumptions):**
- Time-for-money exchange
- Custom solutions for each client  
- Expertise-based pricing
- Limited scalability

**Phase 2: Business Model Expansion Vectors**

I'll guide you through 4 systematic exploration directions:

**1. Product-ization Opportunities**
Transform recurring consulting into scalable products:
- Templates and frameworks you use repeatedly
- Assessment tools clients always need
- Training programs from common knowledge gaps

**2. Platform Business Models**  
Connect value creators in your space:
- Marketplace for specialized consultants
- Community platform for your industry
- Content platform with subscription model

**3. Recurring Revenue Models**
Move from project-based to predictable income:
- Retainer-based advisory relationships
- Subscription access to tools/insights
- Membership community with ongoing value

**4. Leverage & Amplification Models**
Scale your expertise beyond personal time:
- Train and certify other consultants
- License your methodology to companies
- Create affiliate/partnership revenue streams

**Strategic Brainstorming Question:**
Which expansion direction feels most aligned with your current expertise and market position?`,
        timestamp: new Date(Date.now() - 180000).toISOString(),
        metadata: {
          strategic_tags: ["business-model", "brainstorming", "scaling", "productization"]
        }
      },
      {
        id: "msg-3",
        role: "user", 
        content: "The product-ization route interests me most. I do repeat similar frameworks with most clients.",
        timestamp: new Date(Date.now() - 160000).toISOString()
      },
      {
        id: "msg-4",
        role: "assistant",
        content: `Excellent strategic intuition! Product-ization is often the highest ROI path for consultants. Let me guide you through systematic product opportunity discovery:

**BMad Product-ization Framework:**

**Step 1: Pattern Recognition**
Let's identify your repeatable consulting patterns:

**Common Client Challenges You Solve:**
- What problem do 80%+ of clients ask you to solve?
- Which frameworks do you explain repeatedly?  
- What deliverables do you create multiple versions of?
- Where do clients get stuck without your direct guidance?

**Step 2: Product Opportunity Matrix**

**High-Impact, Repeatable Solutions:**
1. **Assessment Tools** - Standardized evaluation frameworks
2. **Implementation Templates** - Step-by-step guides with your methodology  
3. **Training Programs** - Your knowledge packaged for self-learning
4. **Software Tools** - Automated versions of your analysis processes

**Step 3: Product Validation Strategy**

**Validation Questions:**
- Would clients pay separately for this tool/framework?
- Can it deliver value without your personal involvement?
- Is the market bigger than your current client base?
- Does it create ongoing relationship vs one-time purchase?

**Strategic Product Brainstorming:**
Think about your last 10 client engagements:
- What's the one thing you always have to teach them?
- What deliverable do they reference months after you're done?
- What part of your process do they struggle to implement alone?

**My Strategic Hypothesis:**
Your highest-value product is likely the thing clients ask for help with AFTER your main engagement ends.

What patterns are you noticing in your recent client work?`,
        timestamp: new Date(Date.now() - 140000).toISOString(),
        metadata: {
          strategic_tags: ["product-validation", "pattern-recognition", "consulting-productization"]
        }
      },
      {
        id: "msg-5",
        role: "user",
        content: "Almost all my clients struggle with stakeholder alignment during strategy implementation. I always create the same type of alignment framework.",
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: "msg-6",
        role: "assistant",
        content: `🎯 **BINGO!** You've identified a goldmine product opportunity! Stakeholder alignment is a universal pain point with massive market potential.

**Strategic Product Opportunity: 'Stakeholder Alignment Toolkit'**

**Why This Is Strategic Gold:**
1. **Universal Problem** - Every company with >10 people has alignment challenges
2. **Recurring Need** - Not a one-time fix, ongoing organizational challenge
3. **High Pain Point** - Misalignment kills 70% of strategic initiatives
4. **Premium Value** - Companies pay significant amounts to solve this

**Product Roadmap Development:**
**MVP Version (Month 1):**
- Stakeholder mapping template
- Alignment assessment scorecard  
- Communication framework guide
- 3 video tutorials

**V2 Enhancement (Month 3):**
- Interactive digital toolkit
- Customizable templates by company size
- Progress tracking dashboard
- Email sequence for implementation

**V3 Scale (Month 6):**
- Team collaboration features
- Integration with Slack/Teams
- Analytics on alignment improvement  
- Certification program for internal champions

**Business Model Options:**
1. **One-time purchase:** $497 comprehensive toolkit
2. **Subscription model:** $97/month with ongoing updates
3. **Enterprise licensing:** $5K+ for company-wide deployment
4. **Training program:** $1,997 certification course

**Next Strategic Actions:**
1. **Validate demand:** Survey past clients about willingness to pay
2. **Create MVP:** Build simple version of your framework  
3. **Test pricing:** A/B test different price points
4. **Scale preparation:** Document your implementation process

**My Strategic Assessment:** This could generate $500K+ annually within 18 months based on your expertise and market size.

Ready to dive deeper into any aspect of this product strategy?`,
        timestamp: new Date(Date.now() - 100000).toISOString(),
        metadata: {
          strategic_tags: ["product-opportunity", "stakeholder-alignment", "revenue-projection", "go-to-market"]
        }
      }
    ]
  }
]

export function getScenarioByIndex(index: number): DemoScenario | null {
  return demoScenarios[index] || null
}

export function getScenarioCount(): number {
  return demoScenarios.length
}

export function getScenarioSlugs(): string[] {
  return demoScenarios.map((_, index) => index.toString())
}