---
type: "always_apply"
---

# 📌 Augment Agent Guide — SynkBoard Project

## 🚨 Priority Instructions (Non-Negotiable)

1. **Do not guess logic, schema, or component behavior.**
   - All business logic must strictly adhere to `.augment/rules/*.md` files.
   - If a rule or API contract is missing, raise a flag and halt execution.

2. **Never simplify or “fix” logic unless explicitly allowed.**
   - Do not replace dynamic logic with hardcoded values.
   - Do not bypass validation, permissions, or schema enforcement.

3. **Respect role-based access control at all times.**
   - Every API call and UI route must validate `role` and `tenantId`.
   - See: `role-based-access.md`

4. **All entities, dashboards, records, and events must be tenant-isolated.**
   - No logic may cross-access or bypass tenant validation.

5. **Prefer import and reuse — do not reimplement known patterns.**
   - Example: Use shared `apiService`, `EntityForm`, or `DashboardContext` instead of redefining them.

6. **Do not override system-managed fields.**
   - Fields like `tenantId`, `id`, `createdAt`, `role`, `isActive` must never be mutated via frontend or non-authorized logic.

7. **All state-mutating operations must be logged and auditable.**
   - Applies to: webhook handling, record creation, rule executions, and entity updates.

8. **If a logic block depends on an undefined external system, escalate.**
   - Example: Unstructured webhook payloads or undocumented n8n input schema — do not assume format.

## 🎯 Project Objective

This system powers **SynkBoard**, a multi-tenant analytics platform where:
- Data is ingested dynamically via webhooks or API
- Custom entities are defined per tenant
- Dashboards and widgets are fully dynamic and configurable
- Rule engine triggers automations when thresholds are met
- All logic is AI-assistable, secure, testable, and auditable

## 🗂️ Rule File Index

| File                       | Purpose |
|---------------------------|---------|
| `role-based-access.md`    | Role matrix, permissions enforcement |
| `file-structure.md`       | Monorepo layout, folder boundaries |
| `api-contracts.md`        | REST API structure, error format |
| `naming-conventions.md`   | File, variable, schema naming conventions |
| `dynamic-entities.md`     | Rules for Entity, Field, Record structure |
| `webhook-behavior.md`     | Webhook ingestion, logging, retry |
| `dashboard-widgets.md`    | Widget types, config, query model |
| `rule-engine.md`          | Trigger logic, evaluation, action types |
| `frontend-behavior.md`    | UI guards, loading, dynamic render |
| `ai-agent-behavior.md`    | Explicit rules for AI agent operation

## 🧠 Agent Behavior Summary

- All `.augment/rules` files must be treated as final and authoritative.
- Rules apply across all code (frontend, backend, database).
- If a task cannot be completed due to a missing or conflicting rule, the agent must raise an error rather than proceed unsafely.
