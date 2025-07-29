---
type: "agent_requested"
description: "This document defines how dynamic dashboard widgets are defined, configured, rendered, and secured inside SynkBoard. Since the system supports schema-less entity records, all widget logic must be dynamically adaptable per tenant, entity, and field type."
---
# 📊 Dashboard Widgets — SynkBoard

This document defines how dynamic dashboard widgets are defined, configured, rendered, and secured inside SynkBoard. Since the system supports schema-less entity records, all widget logic must be dynamically adaptable per tenant, entity, and field type.

---

## 🎯 Purpose

Dashboards in SynkBoard are made up of widgets that visualize data from dynamic entity records. Widgets are:

- Created via the UI or API per dashboard
- Fully tenant-scoped and field-driven
- Configurable with filters, aggregation, and display type
- Backed by real-time query execution over JSONB fields

---

## 🧱 Widget Model

| Field           | Type      | Description                                   |
|----------------|-----------|-----------------------------------------------|
| `id`           | String    | UUID                                          |
| `dashboard_id` | String    | Reference to parent dashboard                 |
| `entity_id`    | String    | Target dynamic entity                         |
| `type`         | Enum      | `kpi`, `bar`, `line`, `table`, `pie`, `list`  |
| `title`        | String    | Display title                                 |
| `config`       | JSON      | Widget-specific settings                      |
| `filters`      | JSON      | Field filters (e.g., `{ "status": "open" }`) |
| `sort`         | JSON      | Sort order config                             |
| `refresh_rate` | Number    | Auto-refresh in seconds                       |
| `is_public`    | Boolean   | If true, visible without auth                 |

---

## 🧠 Widget Behavior

- Widgets must support runtime binding to any entity and field set
- All queries run against `EntityRecord.fields` (JSONB)
- All filters must match `EntityField.key` names, not labels
- Sorting must only be allowed on `is_sortable: true` fields
- Aggregations must match field types (e.g., `count`, `avg`, `min`, `max`, `group by`)
- `list` and `table` widgets must support pagination and column selection
- `kpi` widgets must support `trend` comparison (e.g., % change vs last week)

---

## 📦 Widget Types

### KPI
- Shows single number (count/sum/avg)
- Optional: change vs last N days
- Example: "Open Tickets: 123 (↑ 10%)"

### Bar / Line / Pie
- Must support group-by over field values (e.g., `status`, `priority`)
- Must respect field type: pie = discrete only
- Line/bar must allow time series by `created_at`

### Table
- Paginated, sortable, column-selectable
- Columns must map to available `EntityField` keys

### List
- Simple title + subtitle rendering of most recent N records

---

## ⚙️ Configuration Rules

- Config must include:
  - `entity_slug`
  - `metric_type`: `count`, `avg`, `sum`, etc.
  - `target_field` (if required)
  - `filters` (optional)
  - `group_by` (for visual types)
- Frontend must validate all widget configs via schema before save
- Invalid widgets must be disabled and flagged in UI

---

## 🔒 Access Control

- Widget access is tenant-bound
- Public dashboards must use read-only API layer
- Only users with `role >= ANALYST` may view widgets
- Only `ADMIN` or `EDITOR` may create/edit widgets

---

## 📜 Query Engine Rules

- Query must:
  - Inject tenant ID into all queries
  - Apply field filters only for valid `EntityField.key`
  - Respect sort + limit boundaries
  - Fail if `group_by` or aggregation mismatches field type
- Aggregate functions must fallback safely on empty results
- Use indexed fields when filtering/sorting (if declared `is_filterable`/`is_sortable`)

---

## 📡 Realtime Behavior

- Widgets must support `manual` and `interval` refresh options
- AI/Rules can trigger push updates via WebSocket (`widget_updated`)
- Changes in field schema should soft-refresh affected widgets

---

## 🤖 AI Agent Instructions

- When generating widgets:
  - Use `GET /api/v1/entities/:slug/fields` to understand types
  - Use only filterable/sortable fields
  - Raise `WIDGET_CONFIG_INVALID` if input is mismatched
  - Raise `UNSUPPORTED_AGGREGATION` for invalid `group_by` + type

---

This file is final. All widget creation, rendering, and API/query logic must conform to this standard.
