---
type: "agent_requested"
description: "This file defines the strict rules for building, versioning, and validating SynkBoard’s backend API. These rules apply to all AI agents, backend engineers, and frontend consumers."
---
# 📡 API Contracts — SynkBoard

> 🔍 This API currently supports only REST. All new endpoints must follow RESTful conventions under `/api/v1/*`. Proposals for GraphQL or streaming endpoints must be reviewed and versioned separately.

This file defines the strict rules for building, versioning, and validating SynkBoard’s backend API. These rules apply to all AI agents, backend engineers, and frontend consumers.

APIs are the backbone of SynkBoard’s dynamic ingestion and dashboard system — correctness and consistency are **non-negotiable**.

---

## 🎯 Project API Objectives

SynkBoard is a dynamic, multi-tenant analytics platform where:

- Data is ingested via **webhooks or direct REST APIs**
- Custom entities are dynamically defined per tenant
- Users build dashboards using flexible, reusable widgets
- The backend triggers **rules/automations** (e.g., n8n) based on metrics

Therefore, the API contract must:

- Be **modular**, **versioned**, and **self-validating**
- Always **enforce tenant and role isolation**
- Support both human and machine (bot/AI) usage
- Never assume hardcoded logic or field names

---

## 🧱 API Structure Rules

- APIs must return within 500ms under normal load; ingestion routes must queue or defer long-running logic to background workers
- All APIs must live under `/api/v1/*`
- Every request must include:
  - `Authorization: Bearer <token>` or API key header
  - `X-Tenant-ID` header (inferred from user or required for integration)
- All POST/PUT endpoints must validate shape using Zod (or Joi)
- All success responses must include:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2025-07-29T10:00:00Z" }
}
```
- All error responses must include:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Entity not found."
  }
}
```
- HTTP codes must reflect true status (e.g., 403 for unauthorized, 422 for invalid input)

- All APIs must live under `/api/v1/*`
- Every request must include:
  - `Authorization: Bearer <token>` or API key header
  - `X-Tenant-ID` header (inferred from user or required for integration)
- All POST/PUT endpoints must validate shape using Zod (or Joi)
- All success responses must include:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2025-07-29T10:00:00Z" }
}
```
- All error responses must include:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Entity not found."
  }
}
```
- HTTP codes must reflect true status (e.g., 403 for unauthorized, 422 for invalid input)

---

## 📜 API Logging Requirements

All critical API actions must be logged to ensure observability, auditing, and debugging. Logging is mandatory for:

- ❗ Ingestion events
- ❗ Rule evaluations and automations
- ❗ API key or authentication failures
- ❗ Resource creation, update, or deletion
- ❗ Errors or exceptions in middleware/handlers

### Logging Fields (Minimum)

Every log entry must include:

| Field         | Description                                           |
|---------------|-------------------------------------------------------|
| `timestamp`   | ISO string in UTC                                     |
| `route`       | HTTP endpoint accessed                                |
| `method`      | HTTP verb used (GET, POST, etc.)                      |
| `tenantId`    | ID of the tenant making the request                   |
| `userId`      | Authenticated user ID or integration source           |
| `role`        | Role of the requesting actor                          |
| `statusCode`  | Final HTTP status                                     |
| `durationMs`  | Total processing time in milliseconds                 |
| `errorCode`   | (optional) Specific error code if applicable          |
| `sourceIp`    | IP address of requester (logged only in safe mode)    |
| `requestId`   | UUID for tracing and correlating logs                 |

> Logs must be structured as JSON (or NDJSON) and streamable to log storage like Datadog, Loki, or filesystem with rotation.

### Logging Targets

- Use `logger.info()` for successful, expected operations
- Use `logger.warn()` for unexpected but recoverable events
- Use `logger.error()` for any failure or rejected request

### Redaction & Security

- Do not log credentials, passwords, tokens, or PII
- Use a `sanitizeLogData()` util to redact sensitive fields
- Ensure all logs are compliant with GDPR if user data is included

---

## 🧩 Endpoint Category Types

Each endpoint must implement full CRUD where applicable. If an endpoint omits DELETE, it must justify why.

### 1. `POST /api/v1/ingest`

### 1. `POST /api/v1/ingest`
Used for webhook or bot-based ingestion of dynamic records.
- Requires: API key w/ `INTEGRATION` role
- Payload must include:
```json
{
  "entity": "support_ticket",
  "fields": {
    "title": "",
    "status": "open",
    "created_at": "..."
  }
}
```
- Validates that the entity exists for the tenant and all fields match schema

### 2. `GET /api/v1/entities/:slug/records`
- Role: `EDITOR` or higher
- Returns paginated list of records with tenant scoping

### 3. `POST /api/v1/entities/:slug/records`
- Creates a new record for an entity
- Auto-triggers threshold engine if applicable

### 4. `GET /api/v1/widgets`
- Returns all dashboard widget templates

### 5. `POST /api/v1/widgets`
- Creates a custom widget config (e.g., metric + filter)

### 6. `POST /api/v1/rules/test`
- Allows previewing rule evaluation logic without saving

---

## 🔐 Auth & Role Enforcement

- All APIs must go through:
  - `authMiddleware`
  - `requireRole(minRole: Role)`
  - `withTenantScope(model)` query wrapper
- Use JWT tokens signed by server or short-lived OAuth sessions
- Token refresh behavior must be defined in auth module
- Never expose global resources across tenants

- All APIs must go through:
  - `authMiddleware`
  - `requireRole(minRole: Role)`
  - `withTenantScope(model)` query wrapper
- Never expose global resources across tenants

---

## 🚫 Forbidden API Patterns

- ❌ No unscoped queries (must filter by tenantId)
- ❌ No raw `req.body` without schema validation
- ❌ No frontend-visible stack traces in production
- ❌ Never infer role from email or userId — must be explicitly set in JWT/session

---

## 🧠 AI Agent Guidelines

- Never guess response shape — always follow defined success/error format
- Always check for `req.user.tenantId` or fallback to `X-Tenant-ID`
- Do not invent endpoint names — if missing, raise: `API_ROUTE_UNDEFINED`
- If an entity or record doesn’t exist, return an `ENTITY_NOT_FOUND` or `RECORD_NOT_FOUND` error. Do not retry or skip without escalation.
- Use `.zod.ts` files from `packages/types` when validating payloads

- Never guess response shape — always follow defined success/error format
- Always check for `req.user.tenantId` or fallback to `X-Tenant-ID`
- Do not invent endpoint names — if missing, raise: `API_ROUTE_UNDEFINED`
- Use `.zod.ts` files from `packages/types` when validating payloads

---

This file is final. Any new endpoint or mutation must follow these rules and be validated via lint and test coverage.
