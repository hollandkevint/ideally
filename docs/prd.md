# bMAD Method Analyst Web Platform - Product Requirements Document (PRD)

## Document Information

| Field | Value |
|-------|-------|
| **Product** | ideally.co AI Product Coaching Platform |
| **Document Type** | Evolved PRD (Strategic Workspace → Product Coaching Platform) |
| **Version** | v5.1 |
| **Date** | 2025-09-04 |
| **Author** | John (PM Agent) |
| **Status** | Product Evolution - Market Validation Phase |

---

## Document Structure

This PRD is organized into sharded components for better maintainability and agent access:

### Core PRD Shards
- [Goals & Background Context](./prd/1-goals-context.md) - Product vision, goals, and foundational context
- [Requirements](./prd/2-requirements.md) - Functional, non-functional, and compatibility requirements
- [User Interface Design Goals](./prd/3-ui-goals.md) - UI/UX vision and interaction paradigms
- [Technical Architecture](./prd/4-technical-architecture.md) - Current tech stack and integration approach
- [Epic Structure](./prd/5-epic-structure.md) - Epic breakdown and story organization

### Status & Implementation Shards
- [Current Implementation Status](./prd/6-implementation-status.md) - Brownfield analysis and current state
- [Integration Requirements](./prd/7-integration-requirements.md) - Claude Sonnet 4 integration specifics
- [Risk Assessment](./prd/8-risk-assessment.md) - Technical risks and mitigation strategies

---

## Executive Summary

The ideally.co platform represents a **Strategic Thinking Workspace** that combines:

### **Foundation Vision** (Historical PRD)
- Innovative "Choose-Your-Adventure" AI coaching platform using bMAD Method
- Dual-pane experience: conversational AI coaching (left) + visual canvas (right)
- 30-minute structured strategic sessions with transparent persona adaptation
- Open-source extensible framework for community-driven coaching patterns

### **Current Implementation Status** (Brownfield Analysis)
- **Existing Foundation**: Working Next.js 15 application with Supabase auth and comprehensive database schema
- **Critical Gap**: Claude Sonnet 4 integration missing (currently hardcoded simulation responses)
- **Target**: Transform foundation into fully functional AI-powered strategic coaching platform

### **Hybrid Approach Benefits**
1. **Leverages Existing Investment**: Builds on solid technical foundation
2. **Maintains Vision**: Preserves strategic goals from original PRD
3. **Addresses Reality**: Focuses on actual technical implementation gaps
4. **Enables Agile Delivery**: Clear epic/story structure for AI agent execution

---

## Quick Navigation

### For Product Management
- Start with [Goals & Context](./prd/1-goals-context.md) for vision alignment
- Review [Epic Structure](./prd/5-epic-structure.md) for delivery planning

### For Development Teams
- Check [Current Status](./prd/6-implementation-status.md) for existing codebase context
- Review [Technical Architecture](./prd/4-technical-architecture.md) for implementation guidance
- Follow [Integration Requirements](./prd/7-integration-requirements.md) for Claude API work

### For UX/Design Teams
- Start with [UI Design Goals](./prd/3-ui-goals.md) for design vision
- Reference [Requirements](./prd/2-requirements.md) for functional specifications

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-12-24 | 1.0 | Initial bMAD Method Analyst Web Platform PRD | BMad Master |
| 2025-08-25 | 2.0 | Brownfield Claude Sonnet 4 Integration PRD | Product Management Team |
| 2025-01-14 | 4.0 | Consolidated Hybrid PRD with Sharded Structure | BMad Orchestrator |
| 2025-09-04 | 5.0 | MVP Production Ready Update - Story 1.4 Claude Integration Complete | John (PM Agent) |
| 2025-09-04 | 5.1 | Product Evolution - Strategic Workspace to AI Product Coaching Platform | John (PM Agent) |

---

*This PRD provides comprehensive guidance for developing the ideally.co Strategic Thinking Workspace while maintaining both the original vision and practical implementation requirements.*