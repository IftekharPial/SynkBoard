---
type: "agent_requested"
description: "# 🤖 AI Agent Behavior — SynkBoard  This document defines the expected behavior, access control, error handling, and execution constraints for any AI agents or automation logic acting on behalf of users or integrations in SynkBoard."
---
# 🤖 AI Agent Behavior — SynkBoard

This document defines the expected behavior, access control, error handling, and execution constraints for any AI agents or automation logic acting on behalf of users or integrations in SynkBoard.

AI agents must operate as if they were an external automation system with strict schema-awareness, auditability, and RBAC enforcement.

---

## 🎯 Purpose

AI agents are expected to:

- Generate or complete dashboards, widgets, or summaries
- Trigger or respond to webhook events
- Create/update dynamic entity records
- Assist in rule generation or config suggestions

---

## 🔐 Access Enforcement

- All AI agent operations must:
  - Be tied to a valid `INTEGRATION` API key OR a known user
  - Respect tenant isolation via `tenant_id`
  - Follow RBAC (no UI or schema access for integration keys)

| Role         | AI Capable Actions                             |
|--------------|--------------------------------------------------|
| SUPERADMIN   | All                                            |
| ADMIN        | Assist with schema/rule/dashboard generation   |
| EDITOR       | Suggest dashboards, generate records           |
| ANALYST      | Summarize dashboards, analyze fields           |
| INTEGRATION  | Ingest records only (no read access)           |

---

## 📄 Schema-Safe Behavior

- Agents must never hardcode field names, types, or assumptions
- All record manipulation must be preceded by:
  - `GET /api/v1/entities/:slug/fields`
  - `GET /api/v1/entities/:slug`
- Must validate fields:
  - Type match (e.g., no string in number field)
  - Required field presence
  - Options match for select/multiselect
- Raise:
  - `SCHEMA_UNKNOWN_ENTITY`
  - `FIELD_VALIDATION_FAILED`
  - `UNSUPPORTED_FIELD_TYPE`

---

## ⚙️ Suggested Workflows

### Dashboard Creation
- Fetch available widgets and entity fields
- Recommend layout, filters, metrics
- Raise: `WIDGET_CONFIG_INVALID`, `RBAC_BLOCKED`

### Record Ingestion
- Map external data to valid fields
- Raise: `WEBHOOK_PAYLOAD_INVALID`, `ENTITY_NOT_FOUND`

### Rule Suggestions
- Recommend `conditions` and `actions`
- Auto-fill values from latest entity schema
- Raise: `RULE_CONDITION_INVALID`, `ACTION_EXECUTION_FAILED`

### Data Summarization
- Use tenant-scoped APIs only (no global queries)
- Summaries must state limitations based on access
- No AI output should suggest fields or data not present

---

## 📜 Logging Requirements

- All AI agent interactions must be logged:

| Field          | Description                                |
|----------------|--------------------------------------------|
| `agent_id`     | System/user/integration who initiated      |
| `action_type`  | dashboard_gen, rule_suggest, record_create|
| `entity`       | Target entity (if any)                     |
| `status`       | success, error, rejected                   |
| `error_code`   | if failed                                  |
| `duration_ms`  | Execution time                             |

- Logs are accessible at `GET /api/v1/agents/logs`

---

## 🧠 Model Behavior Safety

- Must operate statelessly (no cross-call memory)
- Never fabricate field names or data
- All generated suggestions must:
  - Be traceable to schema at generation time
  - Respect `is_filterable`, `is_sortable`, and `is_required`
- If unsure, raise error instead of guessing

---

## 🧪 Testing AI Agents

Each integration must include tests for:

- Invalid field mapping
- Schema mismatch detection
- Access errors (RBAC blocked)
- Payload rejection (422 cases)
- Output fidelity (matches actual field config)

---

This file is final. All AI logic, prompt-based agents, and integrations must conform to this contract exactly — no heuristics or shortcut assumptions allowed.
