---
type: "agent_requested"
description: "Dynamic Entities — SynkBoard  This file defines the rules and architecture for handling **dynamic, schema-less entity types and records** in SynkBoard. This is a **core capability** and must be implemented and consumed with strict discipline by all backend code, frontend UI, and AI agents."
---
# 🧬 Dynamic Entities — SynkBoard

This file defines the rules and architecture for handling **dynamic, schema-less entity types and records** in SynkBoard. This is a **core capability** and must be implemented and consumed with strict discipline by all backend code, frontend UI, and AI agents.

---

## 🎯 Purpose

SynkBoard allows each tenant to define **custom entity types** such as:

- `support_ticket`, `live_chat`, `github_issue`, `lead`, etc.

Each entity has its own custom fields, labels, rules, widgets, and records. These are not fixed tables—they are fully runtime-defined.

---

## 🧱 Dynamic Entity Model

All entities must follow this core structure:

### `Entity`

| Field       | Type    | Description                                           |
|-------------|---------|-------------------------------------------------------|
| `id`        | String  | UUID                                                  |
| `tenant_id` | String  | Foreign key to owning tenant                          |
| `name`      | String  | Human-readable name                                   |
| `slug`      | String  | Unique identifier, kebab-case                         |
| `icon`      | String  | Optional emoji or icon identifier                     |
| `color`     | String  | HEX code or Tailwind-safe color                       |
| `is_active` | Boolean | Whether the entity type is active                     |

### `EntityField`

| Field           | Type    | Description                                                         |
|-----------------|---------|---------------------------------------------------------------------|
| `id`            | String  | UUID                                                                |
| `entity_id`     | String  | Reference to parent entity                                          |
| `name`          | String  | Display label (e.g., "Status")                                     |
| `key`           | String  | Snake_case internal name (e.g., `status`)                           |
| `type`          | Enum    | `text`, `number`, `boolean`, `date`, `select`, `multiselect`, `rating`, `user`, `json` |
| `options`       | JSON    | Allowed values for `select`/`multiselect` fields                    |
| `is_required`   | Boolean | Whether the field is required on record creation                    |
| `is_filterable` | Boolean | Whether the field can be used in filters                            |
| `is_sortable`   | Boolean | Whether the field can be used for sorting                           |

### `EntityRecord`

| Field         | Type     | Description                                           |
|---------------|----------|-------------------------------------------------------|
| `id`          | String   | UUID                                                  |
| `tenant_id`   | String   | Tenant scope                                          |
| `entity_id`   | String   | Reference to dynamic entity type                      |
| `fields`      | JSONB    | Key-value pairs for dynamic field values              |
| `created_at`  | DateTime | Timestamp of record creation                          |
| `created_by`  | String   | User ID or integration source that created the record |

> **Note:** Records must always validate against the current `EntityField` schema.

---

## 🛠 Entity Definition API Endpoints

To manage dynamic entity types and their fields, implement RESTful endpoints:

- `POST /api/v1/entities` — Create a new entity type
- `GET /api/v1/entities` — List all entity types for tenant
- `GET /api/v1/entities/:slug` — Retrieve entity type details
- `PUT /api/v1/entities/:slug` — Update entity type metadata (e.g., name, icon)
- `DELETE /api/v1/entities/:slug` — Deactivate or delete an entity type

- `POST /api/v1/entities/:slug/fields` — Add a new field definition
- `GET /api/v1/entities/:slug/fields` — List all fields for entity
- `PUT /api/v1/entities/:slug/fields/:fieldId` — Update a field definition
- `DELETE /api/v1/entities/:slug/fields/:fieldId` — Remove a field definition

All endpoints must enforce:
- **Tenant scope** via `tenantId`
- **RBAC** via `requireRole('ADMIN')` or higher
- **Schema validation** using Zod/Joi

---

## 🧠 Entity Behavior Rules

- A tenant can **create**, **update**, or **delete** its own entity types and fields.
- **Field additions/removals** are allowed at runtime; existing records must remain valid.
- **Field type changes** are prohibited if records exist (e.g., `text` ➔ `number`).
- **Deleting an entity** should cascade field definitions; records may be archived or deleted based on a `cascade` flag.
- Fields require metadata: `is_filterable`, `is_sortable`, and optional `version` timestamp for schema evolution.
- Entities must be **queryable** via API and visualized in dashboard widgets.

---

## 🧩 Record Behavior Rules

- **Create/Update**:
  - Validate the `fields` object against current `EntityField` definitions.
  - Reject unknown or invalid keys.
  - Enforce tenant-level and RBAC scope.
- **Triggering Logic**:
  - Record creation/update may trigger rule evaluations, alerts, or webhooks.
- **Schema Evolution**:
  - Soft-deprecate unused fields.
  - Maintain backward compatibility for old records.
- **Listing Records**:
  - Use `GET /api/v1/entities/:slug/records` with default pagination parameters:
    - `page` (default: `1`)
    - `limit` (default: `20`, max: `100`)
  - Support filtering by any `EntityField.key` via query params: `?status=open&assigned_to=123`.
  - Support sorting by any sortable field: `?sort_by=created_at&order=desc`.

---

## 📦 Storage & Performance

- Store `EntityRecord.fields` in PostgreSQL **JSONB**.

- **Indexing**:
  - GIN index on `fields` for full-text search and key existence queries.
  - BTREE indexes on frequently filtered keys: `(fields->>'status')`, `(fields->>'assigned_to')`, `created_at`.
  - Optional partial indexes for high-cardinality fields if needed.

- **Automatic Index Creation**:
  - Provide migration scripts or code to auto-create recommended indexes.

- **Maintenance & Reindexing**:
  - Schedule weekly `REINDEX` operations and monthly `VACUUM FULL` during off-peak hours.
  - Monitor index bloat; reindex when fragmentation exceeds 50%.

- **Monitoring**:
  - Use PostgreSQL metrics (`pg_stat_user_indexes`) to track index usage and plan optimizations.

- Aim for sub-200ms query latency for common filters and aggregations.

---

## 🔐 Security, Audit & Tenant Scope

- All entity, field, and record APIs must enforce:
  - `authMiddleware`
  - `requireRole('EDITOR' or 'ADMIN')` depending on operation.
  - `withTenantScope(model)` to prevent cross-tenant access.
- Global entities require `is_global: true` and `SUPERADMIN` role to manage.
- **Emit audit events on schema changes**:
  - `entity_created`
  - `entity_updated`
  - `field_added`
  - `field_updated`
  - `field_removed`

These events drive UI updates and WebSocket notifications so frontends can reactively refresh schemas.

---

## 🤖 AI Agent Instructions

- Always fetch the current schema via `GET /api/v1/entities/:slug/fields` before operations.
- Never hardcode field names or types.
- On unknown field type: raise `DYNAMIC_FIELD_TYPE_UNSUPPORTED`.
- On mid-operation schema change: raise `ENTITY_SCHEMA_CHANGED`.
- Cache field definitions client-side using ETag or WS subscriptions; invalidate on `field_*` events.

---

This file is final. All dynamic entity and record features must conform to this contract.
