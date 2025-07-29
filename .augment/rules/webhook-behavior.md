---
type: "agent_requested"
description: " This document defines the rules and behavior for webhook ingestion in SynkBoard. Webhooks are a core ingestion method that allow external platforms (e.g., n8n, Zapier, custom scripts) to send structured data into SynkBoard.  All webhook processing must be consistent, safe, auditable, and dynamic."
---
# 🔄 Webhook Behavior — SynkBoard

This document defines the rules and behavior for webhook ingestion in SynkBoard. Webhooks are a core ingestion method that allow external platforms (e.g., n8n, Zapier, custom scripts) to send structured data into SynkBoard.

All webhook processing must be consistent, safe, auditable, and dynamic.

---

## 🎯 Purpose

SynkBoard uses webhooks to:

- Ingest entity records dynamically via `POST /api/v1/ingest`
- Trigger automation rules based on thresholds and field values
- Allow third-party automation platforms (e.g., n8n) to push data securely

---

## 🧩 Webhook Endpoint Design

Webhook ingestion is centralized at:

```
POST /api/v1/ingest
```

### Required Headers:
- `Authorization: Bearer <api_key>` — must match an `INTEGRATION` scoped token
- `X-Tenant-ID: <tenant_id>` — tenant scoping is mandatory

### Payload Format:

Payloads must fully conform to the dynamic schema for the given entity. For complex types, use the following rules:

- `multiselect`: array of string values (e.g., `["urgent", "vip"]`)
- `date`: ISO 8601 format (e.g., `"2025-07-29T12:00:00Z"`)
- `user`: must be an existing user ID string (e.g., `"usr_xxx"`)
- `json`: any valid JSON object (e.g., `{ "details": "string", "metadata": { "foo": 1 } }`)
```json
{
  "entity": "support_ticket",
  "fields": {
    "title": "Refund not processed",
    "status": "open",
    "priority": "high"
  }
}
```

---

## ✅ Validation Rules

- The `entity` must exist and belong to the tenant
- The `fields` must match the field schema (name/type/required)
- All field values must conform to type definitions (e.g., `boolean`, `multiselect`, `json`, `user`, `date`)
- Extra fields or schema mismatches must be rejected
- Deprecated fields (soft-deleted) must be ignored but logged with a warning

> ❌ Webhooks must not auto-create schema or fallback to defaults — schema must exist ahead of time

- The `entity` must exist and belong to the tenant
- The `fields` must match the field schema (name/type/required)
- All field values must conform to type definitions (e.g., `boolean`, `multiselect`)
- Extra fields or schema mismatches must be rejected

> ❌ Webhooks must not auto-create schema or fallback to defaults — schema must exist ahead of time

---

## ⚙️ Behavior on Success

If the webhook is valid:

- A new `EntityRecord` is created under the correct tenant scope
- `created_by` is set to the API key's source
- Field values are type-coerced if necessary (e.g., strings to booleans)
- All values are normalized per schema rules (e.g., trimmed strings, lowercased tags)
- Trigger evaluation is queued (rules/alerts)
- A webhook event is emitted: `webhook_ingested`
- Response is:
```json
{
  "success": true,
  "record_id": "rec_abc123",
  "triggered_rules": 2
}
```

If the webhook is valid:

- A new `EntityRecord` is created under the correct tenant scope
- `created_by` is set to the API key's source
- Trigger evaluation is queued (rules/alerts)
- A webhook event is emitted: `webhook_ingested`
- Response is:
```json
{
  "success": true,
  "record_id": "rec_abc123",
  "triggered_rules": 2
}
```

---

## ❗ Behavior on Failure

If validation fails:

- Return `422` with structured error message:
```json
{
  "success": false,
  "error": {
    "code": "FIELD_VALIDATION_FAILED",
    "message": "Field 'status' must be a string"
  }
}
```
- No partial ingestion — all-or-nothing
- Emit event: `webhook_rejected`
- Log full failure reason (redacted if sensitive)

---

## 🔐 Security & Rate Limits

- Webhook keys must:
  - Belong to a tenant
  - Be explicitly scoped to `INTEGRATION`
  - Be rotated and expire regularly
- Rate limit per key: `60 req/min` default, adjustable per tenant
- Abuse detection emits: `webhook_rate_limited`, `webhook_abuse_flagged`

---

## 📜 Logging & Auditing

Log every webhook event with:

| Field             | Description                                           |
|------------------|-------------------------------------------------------|
| `request_id`      | UUID for tracing                                     |
| `tenant_id`       | Tenant that owns the data                            |
| `entity`          | Target entity                                        |
| `source_ip`       | IP address of request                                |
| `status`          | `success` or `failed`                                |
| `duration_ms`     | Processing time                                      |
| `error_code`      | If failed                                            |
| `schema_version`  | Hash or version of the schema used for this payload |
| `deprecated_keys` | (optional) List of ignored deprecated fields         |

> Logs must be structured and streamable to logging platforms (e.g., Datadog, Logtail).

Log every webhook event with:

| Field         | Description                        |
|---------------|------------------------------------|
| `request_id`  | UUID for tracing                   |
| `tenant_id`   | Tenant that owns the data          |
| `entity`      | Target entity                      |
| `source_ip`   | IP address of request              |
| `status`      | `success` or `failed`              |
| `duration_ms` | Processing time                    |
| `error_code`  | If failed                          |

> Logs must be structured and streamable to logging platforms

---

## 🤖 AI Agent Instructions

- Always use `POST /api/v1/ingest`
- Fetch field schema via `GET /api/v1/entities/:slug/fields` before posting
- Do not guess field types or required values
- Raise `WEBHOOK_PAYLOAD_INVALID` on shape mismatch
- Raise `WEBHOOK_ENTITY_UNKNOWN` if target entity does not exist
- Raise `WEBHOOK_REJECTED` if response is `422`

---

This file is final. All webhook ingestion behavior must conform to this contract.
