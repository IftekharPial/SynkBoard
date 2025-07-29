#!/usr/bin/env tsx

/**
 * Script to create API keys for integrations
 * Usage: npm run script:create-api-key -- --tenant-id=<id> --name=<name>
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function createApiKey() {
  const args = process.argv.slice(2);
  const tenantId = args.find(arg => arg.startsWith('--tenant-id='))?.split('=')[1];
  const name = args.find(arg => arg.startsWith('--name='))?.split('=')[1];

  if (!tenantId || !name) {
    console.error('Usage: npm run script:create-api-key -- --tenant-id=<id> --name=<name>');
    process.exit(1);
  }

  const apiKey = `sk_${randomBytes(32).toString('hex')}`;
  
  console.log(`Creating API key for tenant: ${tenantId}`);
  console.log(`API Key: ${apiKey}`);
  console.log('Store this securely - it will not be shown again.');

  await prisma.$disconnect();
}

createApiKey().catch(console.error);
