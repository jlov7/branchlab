# BranchLab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a complete BranchLab local-first product with replay, branching, compare, policy simulation, exports, and verified quality gates.

**Architecture:** Next.js app (`apps/web`) backed by local SQLite + blob store in `.atl/`, domain logic in `packages/core`, policy backends in `packages/policy`, and instrumentation helpers in `packages/sdk`.

**Tech Stack:** TypeScript, Next.js App Router, Node built-in SQLite, Vitest, Playwright, Turbo.

---

## Tasks

1. Apply spec-hardening doc corrections and align acceptance criteria with explicit tests.
2. Scaffold workspace and shared tooling.
3. Implement persistence, ingestion, and domain APIs.
4. Build UX screens and interactions.
5. Add branching/compare/blame/policy/export features.
6. Add tests and run full verification gates.
