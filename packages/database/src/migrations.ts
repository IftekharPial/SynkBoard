/**
 * Database migration utilities for SynkBoard
 * Handles schema evolution and data migrations
 */

import { prisma } from './client';

export interface Migration {
  id: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

/**
 * Run pending migrations
 */
export async function runMigrations(migrations: Migration[]) {
  console.log('🔄 Running database migrations...');
  
  for (const migration of migrations) {
    try {
      console.log(`Running migration: ${migration.name}`);
      await migration.up();
      console.log(`✅ Completed migration: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.name}`, error);
      throw error;
    }
  }
  
  console.log('✅ All migrations completed');
}

/**
 * Rollback migrations
 */
export async function rollbackMigrations(migrations: Migration[]) {
  console.log('🔄 Rolling back database migrations...');
  
  // Run migrations in reverse order
  for (const migration of migrations.reverse()) {
    try {
      console.log(`Rolling back migration: ${migration.name}`);
      await migration.down();
      console.log(`✅ Rolled back migration: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Rollback failed: ${migration.name}`, error);
      throw error;
    }
  }
  
  console.log('✅ All migrations rolled back');
}

/**
 * Example migration for adding indexes
 */
export const addIndexesMigration: Migration = {
  id: '001',
  name: 'add_performance_indexes',
  description: 'Add performance indexes for JSONB queries',
  async up() {
    // Add GIN index for JSONB fields
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_records_fields_gin 
      ON entity_records USING GIN (fields);
    `;
    
    // Add indexes for commonly filtered fields
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_records_status 
      ON entity_records USING BTREE ((fields->>'status'));
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_records_priority 
      ON entity_records USING BTREE ((fields->>'priority'));
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_records_created_at 
      ON entity_records USING BTREE (created_at DESC);
    `;
  },
  async down() {
    await prisma.$executeRaw`DROP INDEX IF EXISTS idx_entity_records_fields_gin;`;
    await prisma.$executeRaw`DROP INDEX IF EXISTS idx_entity_records_status;`;
    await prisma.$executeRaw`DROP INDEX IF EXISTS idx_entity_records_priority;`;
    await prisma.$executeRaw`DROP INDEX IF EXISTS idx_entity_records_created_at;`;
  },
};
