/**
 * Database Test Setup for SynkBoard
 * Configures test database and utilities for database package tests
 */

const { PrismaClient } = require('@prisma/client');

// Test database setup
let prisma;

beforeAll(async () => {
  // Initialize test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test-db.db',
      },
    },
  });

  // Connect to database
  await prisma.$connect();

  // Clean database before tests
  await cleanDatabase();
});

afterAll(async () => {
  // Clean up after all tests
  await cleanDatabase();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});

// Database cleanup utility
async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';
  `;

  for (const { name } of tablenames) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
    } catch (error) {
      console.warn(`Failed to clean table ${name}:`, error.message);
    }
  }
}

// Export prisma for use in tests
global.testPrisma = prisma;
