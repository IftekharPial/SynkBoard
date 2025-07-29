---
type: "agent_requested"
description: "This document defines the mandatory role system and access enforcement model for SynkBoard. It applies to all backend APIs, frontend UI layers, webhook handlers, and AI-generated logic."
---
# 🔐 Role-Based Access Control (RBAC) — SynkBoard

This document defines the mandatory role system and access enforcement model for SynkBoard. It applies to all backend APIs, frontend UI layers, webhook handlers, and AI-generated logic.

---

## 👤 Role Definitions

| Role         | Scope         | Description                                                           |
|--------------|---------------|-----------------------------------------------------------------------|
| `SUPERADMIN` | Platform-wide | Internal only. Full platform access across all tenants and users.     |
| `ADMIN`      | Tenant        | Manages tenant-specific users, dashboards, automations, and entities. |
| `EDITOR`     | Tenant        | Creates/updates dashboards and records. No user management.           |
| `ANALYST`    | Tenant        | View-only for analytics. Cannot modify data.                          |
| `VIEWER`     | Tenant        | Minimal role. Can only view public dashboards.                        |
| `INTEGRATION`| Tenant/API    | Bot access (e.g., n8n). Can push data via API only.                   |

---

## ✅ Permission Matrix

> ⚠️ When adding new capabilities to the system, update this matrix and enforce them via `canPerform()` or middleware. Missing rules will result in undefined behavior.

| Capability                        | SUPERADMIN | ADMIN | EDITOR | ANALYST | VIEWER | INTEGRATION |
|----------------------------------|:----------:|:-----:|:------:|:-------:|:------:|:-----------:|
| View dashboards                  | ✅         | ✅    | ✅     | ✅      | ✅     | ❌          |
| Create/edit dashboards           | ✅         | ✅    | ✅     | ❌      | ❌     | ❌          |
| View entities & records          | ✅         | ✅    | ✅     | ✅      | ✅     | ✅ (API)    |
| Create/update entity records     | ✅         | ✅    | ✅     | ❌      | ❌     | ✅ (API)    |
| Modify entity schema             | ✅         | ✅    | ❌     | ❌      | ❌     | ❌          |
| Manage users                     | ✅         | ✅    | ❌     | ❌      | ❌     | ❌          |
| Manage webhooks                  | ✅         | ✅    | ✅     | ❌      | ❌     | ❌          |
| Trigger rule actions             | ✅         | ✅    | ✅     | ❌      | ❌     | ✅          |
| View webhook/audit logs          | ✅         | ✅    | ❌     | ❌      | ❌     | ❌          |
| Access UI                        | ✅         | ✅    | ✅     | ✅      | ✅     | ❌          |
| Use API tokens                   | ✅         | ✅    | ❌     | ❌      | ❌     | ✅          |

| Capability                        | SUPERADMIN | ADMIN | EDITOR | ANALYST | VIEWER | INTEGRATION |
|----------------------------------|:----------:|:-----:|:------:|:-------:|:------:|:-----------:|
| View dashboards                  | ✅         | ✅    | ✅     | ✅      | ✅     | ❌          |
| Create/edit dashboards           | ✅         | ✅    | ✅     | ❌      | ❌     | ❌          |
| View entities & records          | ✅         | ✅    | ✅     | ✅      | ✅     | ✅ (API)    |
| Create/update entity records     | ✅         | ✅    | ✅     | ❌      | ❌     | ✅ (API)    |
| Modify entity schema             | ✅         | ✅    | ❌     | ❌      | ❌     | ❌          |
| Manage users                     | ✅         | ✅    | ❌     | ❌      | ❌     | ❌          |
| Manage webhooks                  | ✅         | ✅    | ✅     | ❌      | ❌     | ❌          |
| Trigger rule actions             | ✅         | ✅    | ✅     | ❌      | ❌     | ✅          |
| View webhook/audit logs          | ✅         | ✅    | ❌     | ❌      | ❌     | ❌          |
| Access UI                        | ✅         | ✅    | ✅     | ✅      | ✅     | ❌          |
| Use API tokens                   | ✅         | ✅    | ❌     | ❌      | ❌     | ✅          |

---

## 🧱 Role Enforcement Model

Every protected action must validate:

- The authenticated user’s `role`
- The user’s assigned `tenantId`
- The resource’s associated `tenantId`

**Both frontend and backend must enforce these checks independently** — backend should never assume UI role restrictions are sufficient.

**Never** grant access based on `userId`, `email`, or frontend visibility alone.

Every protected action must validate:

- The authenticated user’s `role`
- The user’s assigned `tenantId`
- The resource’s associated `tenantId`

**Never** grant access based on `userId`, `email`, or frontend visibility alone.

---

## 🧐 Role Hierarchy

```ts
const ROLE_HIERARCHY = {
  SUPERADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  ANALYST: 2,
  VIEWER: 1,
  INTEGRATION: 0
}
```

Use this for enforcement checks:

```ts
if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY["EDITOR"]) {
  throw new AccessDenied()
}
```

---

## ♻️ Reusable Permission Map

Avoid hardcoding access checks. Use a central `canPerform()` function:

```ts
const PERMISSIONS = {
  "dashboard:create": ["SUPERADMIN", "ADMIN", "EDITOR"],
  "entity:editSchema": ["SUPERADMIN", "ADMIN"],
  "record:create": ["SUPERADMIN", "ADMIN", "EDITOR", "INTEGRATION"]
}
```

Then call:

```ts
canPerform("record:create", user.role)
```

---

## 📁 Shared Resources Across Tenants

All data is tenant-isolated unless **explicitly marked** as public:

- Set `isPublic: true` and `allowGlobal: true`
- Only `SUPERADMIN` can enable `allowGlobal`
- Public dashboards are still read-only to other tenants

---

## 🔐 System-Managed Fields

These fields must **never** be set or modified by frontend or API requests:

- `tenantId`
- `id`
- `createdAt`
- `updatedAt`
- `role`
- `isActive`

---

## 🔑 API Keys & `INTEGRATION` Role

API keys must:

- Be tied to a tenant
- Be scoped to `INTEGRATION`-only routes
- Be validated by `checkApiKeyPermissions` middleware
- Support optional expiration or manual rotation with audit logging

`INTEGRATION` users:

- ❌ No UI access
- ❌ Cannot manage users or schema
- ✅ Can create entity records if permitted

API keys must:

- Be tied to a tenant
- Be scoped to `INTEGRATION`-only routes
- Be validated by `checkApiKeyPermissions` middleware

`INTEGRATION` users:

- ❌ No UI access
- ❌ Cannot manage users or schema
- ✅ Can create entity records if permitted

---

## 🧪 Required Tests

All protected routes must include:

- ✅ Allowed role passes
- ✅ Disallowed role receives 403
- ✅ Tenant mismatch triggers 403 even with correct role

Both backend and frontend guards (`<ProtectedRoute requiredRole="X" />`) must be tested.

---

## 🔁 Role Change Behavior

- Role changes apply on next request
- All role demotions must be immediately enforced
- Each change must emit a `user_role_changed` event
- If session tokens or cookies cache elevated roles, they must be refreshed or invalidated immediately on downgrade

- Role changes apply on next request
- All role demotions must be immediately enforced
- Each change must emit a `user_role_changed` event

---

## 🤖 AI Agent Instructions

- Always validate `role` and `tenantId`
- Never use hardcoded role checks — use `canPerform()`
- Do not assign elevated roles unless it’s:
  - The **first user** of a new tenant (onboarding only)
- AI-generated seed/migration scripts must respect role boundaries and not bypass `role` enforcement logic
- If unsure about a permission:
  - **Do not continue**
  - Raise: `RBAC_UNDEFINED_ACTION`

- Always validate `role` and `tenantId`
- Never use hardcoded role checks — use `canPerform()`
- Do not assign elevated roles unless it’s:
  - The **first user** of a new tenant (onboarding only)
- If unsure about a permission:
  - **Do not continue**
  - Raise: `RBAC_UNDEFINED_ACTION`

---

This rule is final and must be applied consistently. No shortcuts, assumptions, or logic bypasses are permitted.
