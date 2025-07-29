---
type: "agent_requested"
description: "This file defines the behavioral standards and rules for the dynamic, tenant-aware, AI-safe frontend of SynkBoard. All UI behavior must conform to these instructions to ensure consistent UX, strict RBAC enforcement, dynamic entity flexibility, and complete runtime customization."
---
# 🖥️ Frontend Behavior — SynkBoard

This file defines the behavioral standards and rules for the dynamic, tenant-aware, AI-safe frontend of SynkBoard. All UI behavior must conform to these instructions to ensure consistent UX, strict RBAC enforcement, dynamic entity flexibility, and complete runtime customization.

---

## 🎯 Purpose

SynkBoard's frontend is fully schema-driven and extensible. This means:

- No field, entity, or dashboard logic is hardcoded
- All data rendering is runtime-resolved from API-driven schema
- RBAC and tenant isolation is enforced on both frontend and backend
- AI or human agents must operate from pure schema contracts

---

## ⚙️ Core UI Contracts

All frontend screens must rely on backend schema to drive UI generation:

| View Type      | API Dependency                                    |
|----------------|---------------------------------------------------|
| Entity Listing | `GET /api/v1/entities`                            |
| Field Metadata | `GET /api/v1/entities/:slug/fields`               |
| Record Listing | `GET /api/v1/entities/:slug/records`              |
| Record Form    | Dynamically rendered from field metadata         |
| Dashboards     | `GET /api/v1/dashboards`, `GET /api/v1/widgets`   |
| Current User   | `GET /api/v1/auth/me`                             |

### Field Rendering Map

| Field Type     | UI Component               |
|----------------|----------------------------|
| `text`         | Text input                 |
| `number`       | Numeric input              |
| `boolean`      | Toggle switch              |
| `date`         | Date picker                |
| `select`       | Dropdown select            |
| `multiselect`  | Multi-tag input            |
| `rating`       | Star/badge selector        |
| `json`         | Read-only JSON viewer      |
| `user`         | Assignee selector          |

---

## 🧠 Dynamic Behavior Rules

- Field rendering and layout must be generated at runtime using schema
- All forms and views must:
  - Enforce `is_required`, `is_filterable`, `is_sortable`, `type`
  - Respect custom field `name` as label, fallback to `key` only if needed
  - Soft-render deprecated fields in read-only mode (gray label, tooltip)
- Filters:
  - Render only filterable fields
  - Use field-type appropriate UI (e.g., range slider for number)
- Sort:
  - Only list `is_sortable: true` fields in dropdown
- Dashboards:
  - Widgets must resolve field labels and display safely (fallback: `--`)
- Entity tabs/views must collapse gracefully if schema is empty or removed

---

## 🔒 Access & Role Enforcement

Frontend must gate features by role:

| Role         | Views Accessible                                   |
|--------------|----------------------------------------------------|
| `SUPERADMIN` | All tenants, all dashboards, all entities          |
| `ADMIN`      | All entity settings, rules, webhooks, widgets      |
| `EDITOR`     | Can create/update records and dashboards only      |
| `ANALYST`    | Read-only dashboards and records                   |
| `VIEWER`     | Public dashboards only                             |
| `INTEGRATION`| No UI access                                       |

- RBAC logic must be enforced on all routes using shared `<ProtectedRoute />`
- Always consume `/me` for `role` and `tenant_id`
- Unauthorized views must return 403 page — do not silently hide

---

## 🖼️ Dashboard & Widget UI

- Widget layout is drag-and-drop grid
- Widget types supported: `kpi`, `table`, `bar`, `line`, `list`, `pie`
- Widgets must support responsive resizing and dynamic config
- Errors must display readable messages (`Invalid config`, `Missing field`, etc.)
- Public dashboards must be 100% client-rendered, even without auth token
- Widget refresh:
  - Respect `refresh_rate` config per widget
  - Allow manual refresh (🌀 icon)

---

## 🔄 Record Forms & Lists

- `Create`, `Edit`, and `Detail` views must resolve from entity field schema
- All input types are derived from field `type` and `options`
- Show validation inline (`Field required`, `Invalid value`)
- Respect custom ordering if provided in schema
- Use optimistic UI pattern for edits

---

## 📡 Live Refresh & WebSocket Support

- All dashboards should support real-time field-driven refresh
- WebSocket message `widget_updated` should re-fetch affected data
- WebSocket `schema_changed` should trigger soft refresh of any form/list UI
- Debounce all background refreshes to avoid rate limit collision

---

## 🤖 AI Agent Instructions

- Always start by fetching:
  - `/entities/:slug/fields`
  - `/auth/me`
- Never assume field existence — validate from schema
- Always use `name` for label, `key` for access
- Use widgets only from the available types
- Raise errors:
  - `SCHEMA_UNKNOWN_ENTITY`
  - `FIELD_NOT_SUPPORTED`
  - `RBAC_BLOCKED`
  - `WIDGET_CONFIG_INVALID`

---

## 🧪 Testing UI Behavior

- All forms must be tested with dynamic schema
- Include unit and E2E tests for:
  - Field visibility per role
  - Field validation feedback
  - Widget rendering with invalid config
  - RBAC-blocked redirects
  - Soft rendering of deprecated fields

---

This file is final. All frontend logic, rendering, and UX behavior must follow this exact structure. No assumptions, shortcuts, or hardcoded schema logic is permitted.
