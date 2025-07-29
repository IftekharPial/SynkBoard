---
type: "agent_requested"
description: "This document defines the behavior and configuration rules for SynkBoard’s dynamic Rule Engine. Rules allow users to automate workflows, trigger alerts, and push data based on dynamic entity field values."
---
# 🧠 Rule Engine — SynkBoard

This document defines the behavior and configuration rules for SynkBoard’s dynamic Rule Engine. Rules allow users to automate workflows, trigger alerts, and push data based on dynamic entity field values.

---

## 🎯 Purpose

Rules allow tenant admins to define conditional logic over their data, such as:

- If `status = urgent` and `priority = high`, send Slack alert
- If `customer_rating < 3`, trigger follow-up sequence in n8n

Rules operate on **EntityRecord** changes and evaluate on create/update.

---

## 📐 Rule Model

| Field         | Type     | Description                              |
|---------------|----------|------------------------------------------|
| `id`          | String   | UUID                                     |
| `tenant_id`   | String   | Scope to tenant                          |
| `entity_id`   | String   | Associated entity                        |
| `name`        | String   | Display name                             |
| `is_active`   | Boolean  | Rule toggle                              |
| `conditions`  | JSON     | List of conditions (see format below)   |
| `actions`     | JSON     | List of actions (see format below)      |
| `run_on`      | Enum     | `create`, `update`, `both`               |
| `created_at`  | DateTime | Timestamp                                |
| `created_by`  | String   | User or integration ID                   |

---

## ⚙️ Condition Format

Each condition checks a field against a comparison:
```json
{
  "field": "priority",
  "operator": "equals",
  "value": "high"
}
```

### Supported Operators:
- `equals`, `not_equals`
- `gt`, `lt`, `gte`, `lte`
- `contains`, `not_contains`
- `in`, `not_in`
- `is_empty`, `is_not_empty`
- `changed`

---

## 🎬 Action Format

Actions define what to trigger when conditions match:
```json
{
  "type": "webhook",
  "url": "https://n8n.example.com/webhook/xyz",
  "method": "POST",
  "payload": {
    "ticket_id": "{{record.id}}",
    "title": "{{record.fields.title}}"
  }
}
```

### Supported Action Types:
- `webhook` — outbound HTTP call
- `notify` — internal alert (e.g., UI toast)
- `tag` — apply a label/tag to the record
- `rate` — set a numeric score field
- `slack` — send Slack message via integration

> Use mustache `{{...}}` templating with full access to `record`, `entity`, `user`, and `rule`

---

## 🔄 Execution Model

- Rules are evaluated **after** record passes validation
- Rules run **per record** in isolation
- All matching rules are evaluated concurrently
- Failed actions do not block other rules
- Trigger log is saved per evaluation with `status`, `duration`, `output`
- Webhook actions include retry w/ exponential backoff (max 3 tries)

---

## 📜 Logging & Audit

Each rule evaluation must log:

| Field         | Description                          |
|---------------|--------------------------------------|
| `rule_id`     | Which rule was triggered             |
| `record_id`   | ID of affected record                |
| `tenant_id`   | Tenant that owns the rule            |
| `status`      | `matched`, `skipped`, `failed`       |
| `duration_ms` | Time to evaluate                     |
| `output`      | JSON object of action responses      |

> Logs must be retained per-tenant and available via `GET /api/v1/rules/logs`

---

## 📥 API Contracts

- `POST /api/v1/rules` — create rule
- `GET /api/v1/rules` — list rules for tenant
- `PUT /api/v1/rules/:id` — update rule
- `DELETE /api/v1/rules/:id` — delete rule
- `GET /api/v1/rules/logs` — fetch recent rule logs

---

## 🔒 Access Control

- Only `ADMIN` can create/update/delete rules
- `EDITOR` can enable/disable or reorder
- `ANALYST` can view rule history only

---

## 🤖 AI Agent Instructions

- Always validate fields and operators against current entity schema
- Raise `RULE_CONDITION_INVALID` if schema mismatch
- Raise `ACTION_EXECUTION_FAILED` on outbound error
- Raise `RULE_TRIGGERED` with action count in logs
- Never assume field values — fetch schema with `GET /api/v1/entities/:slug/fields`

---

This file is final. All rule logic must follow this definition exactly.
