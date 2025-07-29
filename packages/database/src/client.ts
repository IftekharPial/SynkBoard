/**
 * Database client for SynkBoard
 * Provides tenant-scoped and role-aware database access
 */

import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export { prisma };

/**
 * Tenant-scoped query wrapper
 * Ensures all queries are automatically scoped to the tenant
 */
export function withTenantScope<T extends Record<string, any>>(
  tenantId: string,
  baseQuery: T
): T & { tenant_id: string } {
  return {
    ...baseQuery,
    tenant_id: tenantId,
  };
}

/**
 * Create a tenant-scoped Prisma client
 * All queries will automatically include tenant filtering
 */
export function createTenantClient(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          // Skip tenant scoping for models that don't have tenant_id
          const skipTenantScoping = ['Tenant'].includes(model);
          
          if (!skipTenantScoping) {
            args.where = {
              ...args.where,
              tenant_id: tenantId,
            };
          }
          
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          const skipTenantScoping = ['Tenant'].includes(model);
          
          if (!skipTenantScoping) {
            args.where = {
              ...args.where,
              tenant_id: tenantId,
            };
          }
          
          return query(args);
        },
        async findUnique({ model, operation, args, query }) {
          const skipTenantScoping = ['Tenant'].includes(model);
          
          if (!skipTenantScoping) {
            args.where = {
              ...args.where,
              tenant_id: tenantId,
            };
          }
          
          return query(args);
        },
        async create({ model, operation, args, query }) {
          const skipTenantScoping = ['Tenant'].includes(model);
          
          if (!skipTenantScoping) {
            args.data = {
              ...args.data,
              tenant_id: tenantId,
            } as any;
          }
          
          return query(args);
        },
        async update({ model, operation, args, query }) {
          const skipTenantScoping = ['Tenant'].includes(model);
          
          if (!skipTenantScoping) {
            args.where = {
              ...args.where,
              tenant_id: tenantId,
            };
          }
          
          return query(args);
        },
        async delete({ model, operation, args, query }) {
          const skipTenantScoping = ['Tenant'].includes(model);
          
          if (!skipTenantScoping) {
            args.where = {
              ...args.where,
              tenant_id: tenantId,
            };
          }
          
          return query(args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof createTenantClient>;
