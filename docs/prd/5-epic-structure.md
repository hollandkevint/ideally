# Epic Structure

## Epic Approach

**Epic Structure Decision:** **Foundation + Enhancement Epics** with rationale

Given the critical authentication foundation issues discovered during development, the project now requires a foundational Epic 0 to establish reliable authentication before proceeding with the Claude Sonnet 4 integration. This two-phase approach ensures a stable foundation before building advanced features.

**Rationale:**
- Epic 0 addresses critical production blocker preventing all user access
- Epic 1+ enhancement work requires functional authentication foundation
- Sequential dependency structure ensures stable platform progression
- Authentication foundation enables all downstream user-dependent features

## Epic 0: Google Authentication Foundation

### Epic Goal
Replace the broken Vercel-Supabase OAuth integration with Google's pre-built signin system, providing seamless Google-first authentication, cost controls, and scalable user management foundation.

### Epic Value Proposition
**For Users:** Familiar, reliable Google signin without redirect loops or authentication failures
**For Business:** Unblocks all feature development and establishes user acquisition foundation  
**For Development:** Simplified authentication architecture with fewer failure points

### Epic Acceptance Criteria
1. **Google One-Tap Signin:** Users can authenticate using Google's pre-built signin interface
2. **Session Persistence:** User sessions reliably maintained across browser sessions
3. **Cost Controls Ready:** User account foundation supports downstream monetization features
4. **Zero Redirect Loops:** Complete elimination of ERR_TOO_MANY_REDIRECTS errors
5. **Production Stable:** 95%+ authentication success rate in production environment

### Story Breakdown

#### **Story 0.1: Remove Complex OAuth Middleware** ✅ *Ready for Development*
*As a* platform developer,
*I want* to remove the complex Vercel middleware and OAuth callback routes causing redirect loops,
*so that* we have a clean foundation for implementing Google's simplified authentication approach.

#### **Story 0.2: Implement Google Pre-built Signin** ✅ *Ready for Development*
*As a* user wanting to access Thinkhaven,
*I want* to authenticate using Google's familiar One-Tap signin interface,
*so that* I can quickly and reliably access my strategic thinking workspace without authentication errors.

#### **Story 0.3: Update Supabase Configuration for ID Token Flow** ✅ *Ready for Development*
*As a* platform developer,
*I want* Supabase configured to accept Google ID tokens through signInWithIdToken flow,
*so that* user authentication integrates seamlessly with our existing database and user management system.

#### **Story 0.4: Authentication Testing & Validation** ✅ *Ready for Development*
*As a* platform stakeholder,
*I want* comprehensive testing of the new authentication flow across all environments,
*so that* we can confidently deploy without regression and ensure 95%+ authentication success rate.

---

## Epic 1: Claude Sonnet 4 AI Integration & Strategic Coaching Platform

### Epic Goal
Transform the existing ideally.co foundation from hardcoded AI simulation into a fully functional strategic coaching platform powered by Claude Sonnet 4, enabling real-time AI conversations, BMad Method integration, and 30-minute structured strategic thinking sessions.

### Epic Value Proposition
**For Users:** Transition from a non-functional demo to a production-ready strategic thinking partner
**For Business:** Enable real user acquisition and validation of the strategic coaching platform concept
**For Development:** Establish AI integration patterns and architecture for future enhancements

### Epic Acceptance Criteria
1. **Claude Integration Complete:** Real AI responses replace all hardcoded simulations
2. **Strategic Sessions Functional:** Users can complete 30-minute BMad Method sessions with AI guidance
3. **Session Persistence Working:** Users can save, resume, and review strategic thinking sessions
4. **Performance Standards Met:** <2s response times and >95% reliability achieved
5. **Production Ready:** System deployed and available for real user testing

### Story Breakdown

#### **Story 1.1: Fix Session Creation Database Failures** ✅ *Ready for Development*
*As a* user attempting to use the BMad Method,
*I want* session creation to work reliably without database errors,
*so that* I can successfully complete strategic thinking workflows without encountering "Unknown error" failures.

#### **Story 1.2: Improve User Interface State Management** ✅ *Ready for Development*  
*As a* user switching between Mary Chat and BMad Method interfaces,
*I want* my initial input and session state to be preserved seamlessly,
*so that* I don't lose my strategic thinking context when navigating between different interaction modes.

#### **Story 1.3: Enhance User Experience Error Handling** ✅ *Ready for Development*
*As a* user engaging with the BMad Method strategic framework,
*I want* clear guidance, actionable feedback, and graceful error recovery,
*so that* I can maintain productive strategic thinking sessions even when issues occur.

#### **Story 1.4: Conversational AI Coaching Interface** ✅ *Ready for Development*
*As a* user seeking strategic guidance,
*I want* an intelligent conversational partner that helps me think through ideas,
*so that* I can receive expert-level strategic coaching adapted to my specific situation and goals.

### Integration Requirements

**Database Integration Strategy:**
- Maintain existing Supabase schema while adding AI conversation tables
- Implement proper session state management for complex strategic thinking workflows
- Ensure real-time conversation data synchronization

**API Integration Strategy:**
- Replace hardcoded responses with Claude Sonnet 4 API calls
- Implement streaming responses for real-time conversation feel  
- Add proper error handling and rate limiting for AI API usage

**Frontend Integration Strategy:**
- Enhance existing components with AI integration hooks
- Implement real-time conversation state management
- Add BMad Method template integration to existing UI framework

**Testing Integration Strategy:**
- Unit tests for AI integration components
- Integration tests for Claude API communication
- End-to-end tests for complete strategic thinking session workflows

### Risk Mitigation

**Technical Risks:**
- Claude API reliability addressed through fallback strategies and user communication
- Performance bottlenecks mitigated through response streaming and caching
- Database migration risks minimized through additive schema changes

**Integration Risks:**  
- Existing functionality preserved through comprehensive regression testing
- User experience continuity maintained through incremental feature rollout
- Authentication and security patterns preserved through existing Supabase integration

**Deployment Risks:**
- Feature flags enable gradual AI feature rollout
- Database changes implemented as non-destructive additions
- Rollback capability maintained through API abstraction layers

---

## Epic 2: Choose-Your-Adventure Coaching Pathways

### Epic Goal
Transform the existing BMad Method into a **structured choose-your-adventure coaching system** with three distinct pathways that guide users through personalized 30-minute business idea coaching sessions, replacing generic strategic thinking with targeted problem-solving approaches.

### Epic Value Proposition
**For Users:** Clear path selection based on their specific need (new idea, business model problem, feature refinement)
**For Business:** Improved user engagement and completion rates through personalized experiences
**For Platform:** Differentiated coaching methodology that creates competitive advantage

### Epic Acceptance Criteria
1. **Pathway Selection Interface:** Users can choose from 3 coaching pathways with clear descriptions
2. **Pathway-Specific Flows:** Each pathway delivers tailored questioning and coaching approach
3. **Session Time Management:** All pathways complete within 30-minute structured timeframes  
4. **Progress Tracking:** Users see clear progress indicators throughout their chosen pathway
5. **Pathway Completion:** Each pathway produces appropriate business framework outputs

### Story Breakdown

#### **Story 2.1: Pathway Selection & Routing Interface**
*As a* user with a business idea challenge,
*I want* to select the most relevant coaching pathway for my specific situation,
*so that* I receive targeted guidance that addresses my actual needs rather than generic advice.

#### **Story 2.2: "New Idea" Creative Expansion Pathway**  
*As a* entrepreneur with a brand new business idea,
*I want* a coaching session focused on creative expansion and market positioning,
*so that* I can develop my raw concept into a structured business opportunity.

#### **Story 2.3: "Business Model Problem" Revenue Analysis Pathway**
*As a* user stuck on monetization and business model challenges,
*I want* systematic analysis of revenue streams, customer segments, and value propositions,
*so that* I can solve my specific business model problems with proven frameworks.

#### **Story 2.4: "Feature Refinement" User-Centered Design Pathway**
*As a* product manager needing to validate or improve a feature,
*I want* coaching that stress-tests features against user needs and business goals,
*so that* I can make data-driven decisions about feature development priorities.

#### **Story 2.5: Pathway Integration & Session State Management**
*As a* user progressing through any coaching pathway,
*I want* seamless state management that preserves context and allows pathway switching,
*so that* I can adapt my session based on evolving insights without losing progress.

---

## Epic 3: Business Framework Generation & Export

### Epic Goal
Build an **intelligent framework generation system** that transforms coaching session insights into professional, exportable business documents (Lean Canvas, Business Model Canvas, etc.) with direct integration to productivity tools, establishing ideally.co as a complete end-to-end coaching solution.

### Epic Value Proposition
**For Users:** Tangible, professionally-formatted deliverables from their coaching investment
**For Business:** Clear value justification that supports premium pricing ($20-30/session)
**For Market Position:** Differentiation from generic AI chat tools through structured business outputs

### Epic Acceptance Criteria
1. **Dynamic Framework Generation:** AI synthesizes session content into appropriate business frameworks
2. **Multiple Export Formats:** PDF, Notion, Airtable, and email delivery options available
3. **Professional Quality:** Export formatting meets business presentation standards
4. **Framework Variety:** Support for Lean Canvas, Business Model Canvas, Feature Briefs, Market Analysis
5. **Integration Reliability:** 95%+ success rate for all export destinations

### Story Breakdown

#### **Story 3.1: AI Framework Synthesis Engine**
*As a* user completing a coaching session,
*I want* the AI to automatically synthesize my insights into a structured business framework,
*so that* I have a professional document that captures my strategic thinking without manual compilation.

#### **Story 3.2: PDF Export with Professional Formatting**
*As a* user with completed business frameworks,
*I want* to export polished PDF documents suitable for investor presentations or team sharing,
*so that* I can use my coaching session outputs in professional business contexts.

#### **Story 3.3: Notion Workspace Integration**
*As a* Notion user managing business projects,
*I want* to export my coaching frameworks directly to my Notion workspace,
*so that* I can integrate strategic insights into my existing project management workflows.

#### **Story 3.4: Airtable & Spreadsheet Integration**
*As a* data-oriented user tracking multiple business ideas,
*I want* to export coaching insights to Airtable or spreadsheet formats,
*so that* I can analyze and compare multiple strategic options systematically.

#### **Story 3.5: Framework Template Library & Customization**
*As a* user with specific industry or use case needs,
*I want* access to industry-specific framework templates with customization options,
*so that* my exported documents reflect relevant business contexts and terminology.

---

## Epic 4: Monetization & Payment Infrastructure

### Epic Goal
Implement a **comprehensive monetization system** supporting pay-per-session credits, subscription tiers, and freemium models that transforms ideally.co from free platform to profitable AI Product Coaching business with multiple revenue streams.

### Epic Value Proposition
**For Business:** Direct revenue generation through validated willingness-to-pay assumptions
**For Users:** Flexible payment options that match their usage patterns and budget constraints  
**For Market:** Proves commercial viability of AI coaching model with scalable pricing

### Epic Acceptance Criteria
1. **Credit System:** Users can purchase and consume session credits with transparent pricing
2. **Subscription Tiers:** Monthly plans offering multiple coaching sessions with team features
3. **Freemium Model:** 1 free session drives trial-to-paid conversion funnel
4. **Payment Security:** PCI-compliant payment processing with multiple payment methods
5. **Usage Analytics:** Revenue tracking, cohort analysis, and churn prediction capabilities

### Story Breakdown

#### **Story 4.1: Session Credit System & Consumption**
*As a* potential customer interested in coaching sessions,
*I want* to purchase session credits in flexible packages ($20-30 per session),
*so that* I can try the platform without large upfront commitments while maintaining usage control.

#### **Story 4.2: Subscription Tier Management**  
*As a* frequent user needing regular strategic coaching,
*I want* monthly subscription options (5-20 sessions) with team collaboration features,
*so that* I can access ongoing coaching support with predictable costs and enhanced capabilities.

#### **Story 4.3: Freemium Trial & Conversion Flow**
*As a* first-time visitor uncertain about AI coaching value,
*I want* access to one complete free coaching session with gentle conversion prompts,
*so that* I can experience the platform value before making any financial commitment.

#### **Story 4.4: Multi-Tier Payment Processing & Security**
*As a* security-conscious business user making payments,
*I want* multiple secure payment options (credit card, PayPal, corporate accounts),
*so that* I can purchase coaching services through my preferred and approved payment methods.

#### **Story 4.5: Revenue Analytics & Business Intelligence**
*As a* platform owner tracking business performance,
*I want* comprehensive revenue analytics including cohort behavior, churn rates, and LTV metrics,
*so that* I can optimize pricing strategies and improve customer retention systematically.

---

## Epic 5: Market Validation & Analytics Platform

### Epic Goal
Build a **comprehensive validation and analytics system** that proves product-market fit for the AI Product Coaching Platform through systematic measurement of key assumptions, user behavior analysis, and iterative optimization based on real market feedback.

### Epic Value Proposition
**For Business:** Data-driven validation of $50K+ ARR potential with clear path to product-market fit
**For Product:** Evidence-based optimization of coaching effectiveness and user experience
**For Investment:** Concrete metrics proving market demand and sustainable unit economics

### Epic Acceptance Criteria
1. **Core Assumption Tracking:** Automated measurement of critical business model hypotheses
2. **User Behavior Analytics:** Deep insights into session completion, satisfaction, and retention patterns
3. **A/B Testing Infrastructure:** Systematic experimentation capability for pricing, features, and flows
4. **Competitive Intelligence:** Automated monitoring of AI coaching market and competitor moves  
5. **Market Validation Dashboard:** Real-time visibility into product-market fit indicators

### Story Breakdown

#### **Story 5.1: Business Model Assumption Testing Framework**
*As a* platform owner validating market assumptions,
*I want* automated tracking of key hypotheses (pricing acceptance, session completion rates, repeat usage),
*so that* I can make data-driven decisions about product-market fit with statistical confidence.

#### **Story 5.2: User Journey & Conversion Analytics**
*As a* product manager optimizing user experience,
*I want* detailed analytics on user journeys from first visit through paid conversion and retention,
*so that* I can identify and eliminate friction points that prevent users from realizing coaching value.

#### **Story 5.3: Session Quality & Effectiveness Measurement**
*As a* platform owner ensuring coaching quality,
*I want* systematic measurement of session outcomes, user satisfaction, and post-session behavior,  
*so that* I can continuously improve coaching effectiveness and prove value delivery to users.

#### **Story 5.4: Competitive Market Intelligence System**
*As a* strategic decision maker in competitive AI coaching market,
*I want* automated monitoring of competitor features, pricing changes, and market positioning,
*so that* I can maintain competitive advantages and respond quickly to market shifts.

#### **Story 5.5: A/B Testing & Optimization Infrastructure**
*As a* growth-focused platform owner,
*I want* systematic A/B testing capabilities for pricing models, coaching flows, and UI elements,
*so that* I can optimize conversion rates and user experience through evidence-based iteration.

---

## Epic Development Priority & Dependencies

### Implementation Sequence

**Phase 1 (MVP Foundation):** Epic 1 → Epic 2
- Complete Claude integration, then implement choose-your-adventure pathways
- Dependency: Epic 2 requires Epic 1's conversation management foundation

**Phase 2 (Value Delivery):** Epic 3 → Epic 4  
- Build framework generation, then monetization to capture value
- Dependency: Epic 4 requires Epic 3's tangible user value to justify pricing

**Phase 3 (Market Validation):** Epic 5
- Implement analytics and validation after core platform proves initial traction  
- Dependency: Epic 5 requires all previous epics for meaningful market data

### Resource Allocation Guidance

**Epic 1:** High complexity, foundational - allocate senior development resources
**Epic 2:** Medium complexity, UX-focused - requires strong frontend and AI integration skills  
**Epic 3:** Medium complexity, integration-heavy - needs API integration and document generation expertise
**Epic 4:** High complexity, security-critical - requires payment processing and security expertise
**Epic 5:** Low-medium complexity, analytics-focused - can utilize junior resources with analytics background