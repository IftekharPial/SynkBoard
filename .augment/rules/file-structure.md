---
type: "agent_requested"
description: "# 🗂 File Structure Rules — SynkBoard  This document defines the canonical folder and file structure rules for the SynkBoard monorepo. All team members and AI agents must follow these rules to ensure scalability, consistency, and safe modularization."
---
# 🗂 File Structure Rules — SynkBoard  This document defines the canonical folder and file structure rules for the SynkBoard monorepo. All team members and AI agents must follow these rules to ensure scalability, consistency, and safe modularization.

---

## 🏗 Monorepo Structure

```
/ (root)
├── apps/
│   ├── frontend/       # Next.js frontend app
│   └── backend/        # Node.js Express REST API server
│
├── packages/
│   ├── shared/         # Stateless pure utilities (formatting, validation)
│   ├── types/          # Shared TypeScript types/interfaces (import-only)
│   └── database/       # Prisma schema, client, migrations
│
├── .augment/           # Augment agent rules and instructions
├── scripts/            # Dev/ops scripts (e.g., seed, API key generator)
└── .env, README.md, etc
```

> 📌 All shared logic must live in `packages/`. Never cross-import between apps directly.

---

## 📁 Folder-Level Responsibilities

### `apps/frontend`
- All UI logic and rendering (React/Next.js)
- Uses components from `@synkboard/ui`
- Cannot access database or Prisma
- Must call API endpoints in `apps/backend`

### `apps/backend`
- All API endpoints, authentication, middleware, webhooks, rule engine
- Calls into `packages/database` for DB logic
- Never renders UI
- Must enforce RBAC via middleware

### `packages/shared`
- Pure utility functions only
- Must be side-effect-free and stateless
- Examples: `formatDate`, `slugify`, `groupBy`

### `packages/types`
- Shared TypeScript interfaces and enums
- Must contain no logic or side effects
- Example: `Dashboard`, `Entity`, `Role`

### `packages/database`
- Prisma schema + client
- Exposes query functions via `db.<model>.findMany()` etc
- Handles tenant and role scoping

### `.augment/rules`
- Augment rule files only
- Must not include any executable code

### `scripts/`
- CLI scripts (e.g., create API key)
- Must be safe, idempotent, and auditable

---

## ❌ Forbidden Patterns

- ❌ Importing frontend components into backend
- ❌ Direct database access from `apps/frontend`
- ❌ Shared logic that mixes types and utility functions
- ❌ Hardcoding tenantId or user role values in API or UI

---

## 🤖 AI Agent Enforcement

- Use only paths explicitly allowed by this rule
- Never assume file locations; resolve from imports or centralized definitions
- If a file doesn't exist in the structure above:
  - Raise: `FILE_STRUCTURE_UNDEFINED`
  - Do not generate blindly

---

This rule file is final. Do not override or restructure the repo without updating this guide and notifying all agents and contributors.
