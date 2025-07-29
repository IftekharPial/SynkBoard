/**
 * Dynamic entity types and schemas for SynkBoard
 * Following dynamic-entities.md rules
 */

import { z } from 'zod';
import { UuidSchema, SlugSchema, ColorSchema, PaginationParams, PaginatedResponse } from './common';

// Field type definitions following dynamic-entities.md
export const FieldTypeSchema = z.enum([
  'text',
  'number', 
  'boolean',
  'date',
  'select',
  'multiselect',
  'rating',
  'user',
  'json',
]);

export type FieldType = z.infer<typeof FieldTypeSchema>;

// Entity schemas
export const EntitySchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  icon: z.string().optional(),
  color: ColorSchema.optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateEntitySchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  icon: z.string().optional(),
  color: ColorSchema.optional(),
});

export const UpdateEntitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  color: ColorSchema.optional(),
  is_active: z.boolean().optional(),
});

export type Entity = z.infer<typeof EntitySchema>;
export type CreateEntity = z.infer<typeof CreateEntitySchema>;
export type UpdateEntity = z.infer<typeof UpdateEntitySchema>;

// Entity field schemas
export const EntityFieldSchema = z.object({
  id: UuidSchema,
  entity_id: UuidSchema,
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(50).regex(/^[a-z_][a-z0-9_]*$/),
  type: FieldTypeSchema,
  options: z.array(z.string()).optional(), // For select/multiselect
  is_required: z.boolean(),
  is_filterable: z.boolean(),
  is_sortable: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateEntityFieldSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(50).regex(/^[a-z_][a-z0-9_]*$/),
  type: FieldTypeSchema,
  options: z.array(z.string()).optional(),
  is_required: z.boolean().default(false),
  is_filterable: z.boolean().default(true),
  is_sortable: z.boolean().default(true),
});

export const UpdateEntityFieldSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
  is_filterable: z.boolean().optional(),
  is_sortable: z.boolean().optional(),
});

export type EntityField = z.infer<typeof EntityFieldSchema>;
export type CreateEntityField = z.infer<typeof CreateEntityFieldSchema>;
export type UpdateEntityField = z.infer<typeof UpdateEntityFieldSchema>;

// Entity with fields
export const EntityWithFieldsSchema = EntitySchema.extend({
  fields: z.array(EntityFieldSchema),
  _count: z.object({
    records: z.number(),
  }).optional(),
});

export type EntityWithFields = z.infer<typeof EntityWithFieldsSchema>;

// Dynamic field value validation based on type
export function createFieldValueSchema(field: EntityField): z.ZodSchema {
  switch (field.type) {
    case 'text':
      return z.string();
    
    case 'number':
      return z.number();
    
    case 'boolean':
      return z.boolean();
    
    case 'date':
      return z.string().datetime();
    
    case 'select':
      if (!field.options) {
        throw new Error(`Select field '${field.key}' must have options`);
      }
      // Handle options stored as JSON string or array
      const selectOptions = typeof field.options === 'string'
        ? JSON.parse(field.options)
        : field.options;
      if (!Array.isArray(selectOptions) || selectOptions.length === 0) {
        throw new Error(`Select field '${field.key}' must have valid options array`);
      }
      return z.enum(selectOptions as [string, ...string[]]);

    case 'multiselect':
      if (!field.options) {
        throw new Error(`Multiselect field '${field.key}' must have options`);
      }
      // Handle options stored as JSON string or array
      const multiselectOptions = typeof field.options === 'string'
        ? JSON.parse(field.options)
        : field.options;
      if (!Array.isArray(multiselectOptions) || multiselectOptions.length === 0) {
        throw new Error(`Multiselect field '${field.key}' must have valid options array`);
      }
      return z.array(z.enum(multiselectOptions as [string, ...string[]]));
    
    case 'rating':
      return z.number().min(1).max(5);
    
    case 'user':
      return UuidSchema;
    
    case 'json':
      return z.any();
    
    default:
      throw new Error(`Unsupported field type: ${field.type}`);
  }
}

// Entity record schemas
export const EntityRecordSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  entity_id: UuidSchema,
  fields: z.record(z.any()), // Dynamic fields as key-value pairs
  created_at: z.string().datetime(),
  created_by: UuidSchema,
});

export const CreateEntityRecordSchema = z.object({
  fields: z.record(z.any()),
});

export const UpdateEntityRecordSchema = z.object({
  fields: z.record(z.any()),
});

export type EntityRecord = z.infer<typeof EntityRecordSchema>;
export type CreateEntityRecord = z.infer<typeof CreateEntityRecordSchema>;
export type UpdateEntityRecord = z.infer<typeof UpdateEntityRecordSchema>;

// Entity record with user info
export const EntityRecordWithUserSchema = EntityRecordSchema.extend({
  user: z.object({
    id: UuidSchema,
    name: z.string(),
    email: z.string().email(),
  }),
});

export type EntityRecordWithUser = z.infer<typeof EntityRecordWithUserSchema>;

// Record query parameters
export const RecordQueryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
}).catchall(z.any()); // Allow dynamic filter fields

export type RecordQueryParams = z.infer<typeof RecordQueryParamsSchema>;

// Paginated records response
export type PaginatedRecords = PaginatedResponse<EntityRecordWithUser>;

// Field validation result
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validate record fields against entity schema
export function validateRecordFields(
  fields: Record<string, any>,
  entityFields: EntityField[]
): FieldValidationResult {
  const errors: string[] = [];
  const fieldMap = new Map(entityFields.map(f => [f.key, f]));

  // Check required fields
  for (const field of entityFields) {
    if (field.is_required && (fields[field.key] === undefined || fields[field.key] === null)) {
      errors.push(`Field '${field.key}' is required`);
    }
  }

  // Validate field types and values
  for (const [key, value] of Object.entries(fields)) {
    const field = fieldMap.get(key);
    
    if (!field) {
      errors.push(`Unknown field '${key}'`);
      continue;
    }

    if (value === null || value === undefined) {
      continue; // Skip validation for null/undefined values
    }

    try {
      const schema = createFieldValueSchema(field);
      schema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`Field '${key}': ${error.errors[0].message}`);
      } else {
        errors.push(`Field '${key}': Invalid value`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Entity API response types
export interface EntitiesListResponse {
  entities: EntityWithFields[];
}

export interface EntityDetailResponse {
  entity: EntityWithFields;
}

export interface EntityFieldsResponse {
  fields: EntityField[];
}

export interface RecordsListResponse extends PaginatedRecords {}

export interface RecordDetailResponse {
  record: EntityRecordWithUser;
}
