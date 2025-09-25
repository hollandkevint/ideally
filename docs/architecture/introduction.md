# Introduction

This document outlines the complete fullstack architecture for thinkhaven AI Product Coaching Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for our modern fullstack application where these concerns are increasingly intertwined.

## Starter Template or Existing Project

**Base**: Next.js 15 application with custom dual-pane architecture
- **Framework**: Next.js 15 with App Router and Turbopack
- **Constraints**: Existing Supabase integration must be maintained
- **Architectural Decisions**: Dual-pane interface pattern, AI-first design, BMad strategic framework integration
- **What can be modified**: Canvas implementation, BMad-Chat bridge, advanced features
- **What must be retained**: Authentication system, database schema, Claude integration patterns

## Change Log

| Date       | Version | Description                           | Author         |
| ---------- | ------- | ------------------------------------- | -------------- |
| 2025-09-05 | 1.0     | Initial fullstack architecture document | Winston (Architect) |
| 2025-09-05 | 1.1     | Updated to Claude Sonnet 4.0 API specification | Winston (Architect) |
