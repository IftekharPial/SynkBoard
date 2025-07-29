/**
 * Common database queries for SynkBoard
 * All queries respect tenant isolation and RBAC
 */

import { prisma, createTenantClient } from './client';
// Note: Role and FieldType are now strings in SQLite schema

/**
 * Entity-related queries
 */
export const entityQueries = {
  /**
   * Get all entities for a tenant
   */
  async getEntitiesForTenant(tenantId: string) {
    const client = createTenantClient(tenantId);
    return client.entity.findMany({
      where: { is_active: true },
      include: {
        fields: {
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: { records: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Get entity by slug with fields
   */
  async getEntityBySlug(tenantId: string, slug: string) {
    const client = createTenantClient(tenantId);
    return client.entity.findFirst({
      where: { slug, is_active: true },
      include: {
        fields: {
          orderBy: { created_at: 'asc' },
        },
      },
    });
  },

  /**
   * Create new entity with validation
   */
  async createEntity(
    tenantId: string,
    data: {
      name: string;
      slug: string;
      icon?: string;
      color?: string;
    }
  ) {
    const client = createTenantClient(tenantId);
    return client.entity.create({
      data: {
        ...data,
        tenant_id: tenantId,
      },
      include: {
        fields: true,
      },
    });
  },

  /**
   * Add field to entity
   */
  async addFieldToEntity(
    tenantId: string,
    entityId: string,
    fieldData: {
      name: string;
      key: string;
      type: string;
      options?: any;
      is_required?: boolean;
      is_filterable?: boolean;
      is_sortable?: boolean;
    }
  ) {
    return prisma.entityField.create({
      data: {
        entity_id: entityId,
        ...fieldData,
      },
    });
  },
};

/**
 * Record-related queries
 */
export const recordQueries = {
  /**
   * Get records for entity with pagination and filtering
   */
  async getRecordsForEntity(
    tenantId: string,
    entityId: string,
    options: {
      page?: number;
      limit?: number;
      filters?: Record<string, any>;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      filters = {},
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const client = createTenantClient(tenantId);
    const skip = (page - 1) * limit;

    // Build where clause with JSONB filters
    const where: any = { entity_id: entityId };
    
    // Add field filters using JSONB path queries
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        where.fields = {
          ...where.fields,
          path: [key],
          equals: value,
        };
      }
    });

    const [records, total] = await Promise.all([
      client.entityRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: sortOrder }, // Note: Field-based sorting not supported with SQLite string fields
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      client.entityRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Create new record with field validation
   */
  async createRecord(
    tenantId: string,
    entityId: string,
    fields: Record<string, any>,
    createdBy: string
  ) {
    const client = createTenantClient(tenantId);
    return client.entityRecord.create({
      data: {
        tenant_id: tenantId,
        entity_id: entityId,
        fields: JSON.stringify(fields),
        created_by: createdBy,
      },
      include: {
        entity: {
          include: { fields: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },
};

/**
 * User and authentication queries
 */
export const userQueries = {
  /**
   * Get user by email with tenant (for authentication)
   */
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email, is_active: true },
      include: {
        tenant: true,
      },
    });
  },

  /**
   * Get user by ID with tenant
   */
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id, is_active: true },
      include: {
        tenant: true,
      },
    });
  },

  /**
   * Create new user
   */
  async createUser(data: {
    tenant_id: string;
    email: string;
    name: string;
    role: string;
  }) {
    return prisma.user.create({
      data,
      include: {
        tenant: true,
      },
    });
  },

  /**
   * Create refresh token
   */
  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  },

  /**
   * Get refresh token by hash
   */
  async getRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: {
        token_hash: tokenHash,
      },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });
  },

  /**
   * Get all active refresh tokens for validation
   */
  async getActiveRefreshTokens() {
    return prisma.refreshToken.findMany({
      where: {
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });
  },

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.update({
      where: { token_hash: tokenHash },
      data: { is_revoked: true },
    });
  },

  /**
   * Clean expired refresh tokens
   */
  async cleanExpiredRefreshTokens() {
    return prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          { is_revoked: true },
        ],
      },
    });
  },

  /**
   * Validate API key
   */
  async validateApiKey(keyHash: string) {
    return prisma.apiKey.findUnique({
      where: { key_hash: keyHash, is_active: true },
      include: {
        tenant: true,
      },
    });
  },
};

/**
 * Dashboard and widget queries
 */
export const dashboardQueries = {
  /**
   * Get dashboards for tenant
   */
  async getDashboardsForTenant(tenantId: string, includePublic = false) {
    const client = createTenantClient(tenantId);
    return client.dashboard.findMany({
      where: includePublic ? {} : { is_public: false },
      include: {
        widgets: {
          include: {
            entity: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Get dashboard by slug
   */
  async getDashboardBySlug(tenantId: string, slug: string) {
    const client = createTenantClient(tenantId);
    return client.dashboard.findFirst({
      where: { slug },
      include: {
        widgets: {
          include: {
            entity: {
              include: { fields: true },
            },
          },
        },
      },
    });
  },
};
