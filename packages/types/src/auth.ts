/**
 * Authentication and authorization types for SynkBoard
 * Following role-based-access.md rules
 */

import { z } from 'zod';
import { EmailSchema, UuidSchema } from './common';

// Role definitions following role-based-access.md
export const RoleSchema = z.enum([
  'superadmin',
  'admin', 
  'editor',
  'analyst',
  'viewer',
  'integration',
]);

export type Role = z.infer<typeof RoleSchema>;

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<Role, number> = {
  superadmin: 5,
  admin: 4,
  editor: 3,
  analyst: 2,
  viewer: 1,
  integration: 0,
};

// Permission definitions following role-based-access.md
export const PERMISSIONS = {
  'dashboard:view': ['superadmin', 'admin', 'editor', 'analyst', 'viewer'],
  'dashboard:create': ['superadmin', 'admin', 'editor'],
  'dashboard:edit': ['superadmin', 'admin', 'editor'],
  'dashboard:delete': ['superadmin', 'admin'],
  
  'entity:view': ['superadmin', 'admin', 'editor', 'analyst', 'viewer', 'integration'],
  'entity:editSchema': ['superadmin', 'admin'],
  
  'record:view': ['superadmin', 'admin', 'editor', 'analyst', 'viewer', 'integration'],
  'record:create': ['superadmin', 'admin', 'editor', 'integration'],
  'record:update': ['superadmin', 'admin', 'editor'],
  'record:delete': ['superadmin', 'admin'],
  
  'user:manage': ['superadmin', 'admin'],
  'webhook:manage': ['superadmin', 'admin', 'editor'],
  'rule:create': ['superadmin', 'admin'],
  'rule:edit': ['superadmin', 'admin', 'editor'],
  'rule:trigger': ['superadmin', 'admin', 'editor', 'integration'],

  'admin:manage': ['superadmin', 'admin'],
  'audit:view': ['superadmin', 'admin'],
  'api:use': ['superadmin', 'admin', 'integration'],
  'ui:access': ['superadmin', 'admin', 'editor', 'analyst', 'viewer'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// User schemas
export const UserSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  email: EmailSchema,
  name: z.string().min(1).max(100),
  role: RoleSchema,
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(100),
  role: RoleSchema,
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: RoleSchema.optional(),
  is_active: z.boolean().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

// Tenant schemas
export const TenantSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export type Tenant = z.infer<typeof TenantSchema>;
export type CreateTenant = z.infer<typeof CreateTenantSchema>;

// API Key schemas
export const ApiKeySchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  name: z.string().min(1).max(100),
  key_hash: z.string(),
  role: RoleSchema,
  is_active: z.boolean(),
  expires_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expires_at: z.string().datetime().optional(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;

// Authentication request/response schemas
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  user: UserSchema.extend({
    tenant: TenantSchema,
  }),
  token: z.string(),
  expires_at: z.string().datetime(),
});

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string(),
});

export const MeResponseSchema = UserSchema.extend({
  tenant: TenantSchema,
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;

// JWT payload schema
export const JwtPayloadSchema = z.object({
  userId: UuidSchema,
  tenantId: UuidSchema,
  role: RoleSchema,
  email: EmailSchema,
  iat: z.number(),
  exp: z.number(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// Permission check utility type
export interface PermissionCheck {
  permission: Permission;
  role: Role;
}

// Helper functions for role and permission checks
export function canPerform(permission: Permission, role: Role): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly Role[];

  // Handle case where permission doesn't exist or allowedRoles is undefined
  if (!allowedRoles || !Array.isArray(allowedRoles)) {
    console.warn(`Invalid permission: ${permission}`);
    return false;
  }

  // Handle case where role is undefined or null
  if (!role) {
    console.warn(`Invalid role: ${role}`);
    return false;
  }

  return allowedRoles.includes(role);
}

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isSystemManagedField(fieldName: string): boolean {
  const systemFields = [
    'tenantId',
    'tenant_id', 
    'id',
    'createdAt',
    'created_at',
    'updatedAt', 
    'updated_at',
    'role',
    'isActive',
    'is_active',
  ];
  return systemFields.includes(fieldName);
}
