// Database client and query functions for SynkBoard
// Handles tenant and role scoping

export * from './client';
export * from './queries';
export * from './migrations';
export * from './seed';

// Re-export Prisma types for use in other packages
export { Prisma, PrismaClient } from '@prisma/client';
