---
type: "agent_requested"
description: "# 🏷 Naming Conventions — SynkBoard  This document defines the **mandatory naming conventions** for all files, functions, variables, database fields, API routes, and schemas across the SynkBoard monorepo. All contributors and AI agents must follow this exactly — consistency and clarity are enforced."
---
# 🏷 Naming Conventions — SynkBoard

This document defines the **mandatory naming conventions** for all files, functions, variables, database fields, API routes, and schemas across the SynkBoard monorepo. All contributors and AI agents must follow this exactly — consistency and clarity are enforced.

---

## 🧾 File & Folder Naming

- ✅ Use `kebab-case` for file and folder names:
  - `user-profile.ts`, `record-summary-card.tsx`, `threshold-engine/`
- ❌ Do not use `camelCase`, `PascalCase`, or spaces in filenames
- Component folders must be named after the component in lowercase:
  - `components/record-card/RecordCard.tsx`

---

## 🧠 Variable & Function Naming

- ✅ Use `camelCase` for all variables, function names, and parameters:
  - `fetchDashboardData()`, `recordCount`, `tenantId`
- Prefix boolean values with `is/has/should/can`:
  - `isEnabled`, `hasData`, `shouldSync`
- ❌ Do not use underscores (`snake_case`) for JS/TS variables

---

## 🗃 Database Field Naming

- ✅ Use `snake_case` for all Prisma model fields:
  - `created_at`, `user_id`, `dashboard_id`, `is_active`
- All table names should be singular and lowercase:
  - `user`, `dashboard`, `entity_record`
- Enum values must be lowercase, underscore-separated:
  - `role = { superadmin, admin, editor, viewer }`

---

## 📡 API Route Naming

- ✅ Use REST-style resource routes with `kebab-case`:
  - `GET /api/v1/entities`, `POST /api/v1/widgets`
- Route param names must be lowercase and descriptive:
  - `GET /api/v1/entities/:slug/records`
- Avoid deeply nested resources beyond 2 levels

---

## 📦 Package & Module Naming

- ✅ Use `@synkboard/package-name` with lowercase kebab-case naming
  - Example: `@synkboard/types`, `@synkboard/database`
- Keep directory/module names consistent with package names

---

## 📁 Component Naming (React)

- ✅ Use `PascalCase` for all component files and exports:
  - `EntityCard.tsx`, `DashboardGrid.tsx`
- Component folder = kebab-case, Component file = PascalCase
- Co-locate test files as `ComponentName.test.tsx`

---

## 🧪 Test Naming

- File names must mirror the source file:
  - `useDashboard.ts` → `useDashboard.test.ts`
- Use `describe()` blocks for each method or hook
- Test names must be full-sentence readable:
  ```ts
  it('returns empty array when no widgets are configured', () => {})
  ```

---

## 🤖 AI Agent Rules

- Never mix naming styles across layers (e.g., camelCase in DB)
- Use constants or shared enums from `@synkboard/types` where available
- Raise: `NAMING_CONVENTION_VIOLATION` if you detect incorrect casing

---

This document is final. All new files, schemas, and functions must follow these conventions and pass lint/style checks before merge.
