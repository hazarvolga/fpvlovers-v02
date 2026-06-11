-- Migration: 0001_fpv_foundation
-- Purpose: Create FPV Lovers database schemas and migration infrastructure

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application schemas
CREATE SCHEMA IF NOT EXISTS fpvlovers_app;
CREATE SCHEMA IF NOT EXISTS fpvlovers_commerce;
CREATE SCHEMA IF NOT EXISTS fpvlovers_analytics;

-- Migration tracking table
CREATE TABLE IF NOT EXISTS fpvlovers_app.schema_migrations (
  version    TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  checksum   TEXT        NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
