# SynkBoard

A multi-tenant, schema-less analytics platform with dynamic entity definitions, webhook ingestion, and AI-assisted automation.

## Architecture

SynkBoard follows a strict monorepo structure with clear separation of concerns:

- **`apps/frontend`** - Next.js 14 frontend application
- **`apps/backend`** - Node.js Express REST API server
- **`packages/shared`** - Pure utility functions
- **`packages/types`** - Shared TypeScript interfaces and Zod schemas
- **`packages/database`** - Prisma schema, client, and migrations
- **`.augment/rules`** - Architectural rules and constraints
- **`scripts/`** - Development and operations scripts

## Key Features

- **Dynamic Entities**: Runtime-defined entity types with custom fields
- **Webhook Ingestion**: Secure data ingestion from external platforms (n8n, Zapier)
- **Rule Engine**: Automated workflows and alerts based on data thresholds
- **Dashboard Widgets**: Configurable analytics widgets with real-time updates
- **Role-Based Access Control**: Strict tenant isolation and permission enforcement
- **AI Integration**: Schema-aware AI assistance for automation and insights

## Getting Started

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development servers
npm run dev
```

## Documentation

All architectural decisions and implementation rules are documented in `.augment/rules/`:

- [File Structure Rules](.augment/rules/file-structure.md)
- [API Contracts](.augment/rules/api-contracts.md)
- [Dynamic Entities](.augment/rules/dynamic-entities.md)
- [Role-Based Access Control](.augment/rules/role-based-access.md)
- [Webhook Behavior](.augment/rules/webhook-behavior.md)
- [Dashboard Widgets](.augment/rules/dashboard-widgets.md)
- [Rule Engine](.augment/rules/rule-engine.md)
- [Frontend Behavior](.augment/rules/frontend-behavior.md)
- [AI Agent Behavior](.augment/rules/ai-agent-behavior.md)
- [Naming Conventions](.augment/rules/naming-conventions.md)

## License

MIT
