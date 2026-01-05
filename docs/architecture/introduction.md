# Introduction

This document outlines the complete fullstack architecture for ThinkHaven Decision Accelerator, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

ThinkHaven is a **decision accelerator** that applies structured methodology to validate or kill business ideas before users waste time building. The platform delivers value through enforced methodology, anti-sycophancy, and polished portable outputs.

## Starter Template or Existing Project

**Base**: Next.js 15 application with conversation-first architecture
- **Framework**: Next.js 15 with App Router and Turbopack
- **Constraints**: Existing Supabase integration must be maintained
- **Architectural Decisions**: Conversation-first design, sub-persona system, polished output generation
- **What can be modified**: Output templates, sub-persona weights, pathway configurations
- **What must be retained**: Authentication system, database schema, Claude integration patterns

## Change Log

| Date       | Version | Description                           | Author         |
| ---------- | ------- | ------------------------------------- | -------------- |
| 2025-09-05 | 1.0     | Initial fullstack architecture document | Winston (Architect) |
| 2025-09-05 | 1.1     | Updated to Claude API specification | Winston (Architect) |
| 2026-01-04 | 1.2     | Updated for decision accelerator positioning and sub-persona system | Strategic Refinement |
