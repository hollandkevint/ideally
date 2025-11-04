-- Enable required PostgreSQL extensions
-- Run this FIRST before any other migrations

-- UUID support (already enabled by default, but ensuring it's there)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector support for semantic search (required by migration 001)
CREATE EXTENSION IF NOT EXISTS vector;

-- Comments
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';
COMMENT ON EXTENSION vector IS 'Vector similarity search (pgvector) for semantic embeddings';
