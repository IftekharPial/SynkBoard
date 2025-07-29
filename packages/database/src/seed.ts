/**
 * Database seeding script for SynkBoard
 * Creates initial data for development and testing
 */

import { prisma } from './client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      is_active: true,
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'admin@demo.com',
      name: 'Admin User',
      password_hash: adminPasswordHash,
      role: 'admin',
      is_active: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create API key for integrations
  const apiKeyHash = randomBytes(32).toString('hex');
  const apiKey = await prisma.apiKey.upsert({
    where: { key_hash: apiKeyHash },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Demo Integration Key',
      key_hash: apiKeyHash,
      role: 'integration',
      is_active: true,
    },
  });

  console.log('✅ Created API key:', `sk_${apiKeyHash.substring(0, 8)}...`);

  // Create sample entity: Support Tickets
  const supportEntity = await prisma.entity.upsert({
    where: { 
      tenant_id_slug: {
        tenant_id: tenant.id,
        slug: 'support-tickets'
      }
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Support Tickets',
      slug: 'support-tickets',
      icon: '🎫',
      color: '#3b82f6',
      is_active: true,
    },
  });

  console.log('✅ Created entity:', supportEntity.name);

  // Create fields for support tickets
  const fields = [
    {
      name: 'Title',
      key: 'title',
      type: 'text',
      is_required: true,
      is_filterable: true,
      is_sortable: true,
    },
    {
      name: 'Status',
      key: 'status',
      type: 'select',
      options: JSON.stringify(['open', 'in_progress', 'resolved', 'closed']),
      is_required: true,
      is_filterable: true,
      is_sortable: true,
    },
    {
      name: 'Priority',
      key: 'priority',
      type: 'select',
      options: JSON.stringify(['low', 'medium', 'high', 'urgent']),
      is_required: true,
      is_filterable: true,
      is_sortable: true,
    },
    {
      name: 'Description',
      key: 'description',
      type: 'text',
      is_required: false,
      is_filterable: false,
      is_sortable: false,
    },
    {
      name: 'Customer Rating',
      key: 'customer_rating',
      type: 'rating',
      is_required: false,
      is_filterable: true,
      is_sortable: true,
    },
  ];

  for (const fieldData of fields) {
    await prisma.entityField.upsert({
      where: {
        entity_id_key: {
          entity_id: supportEntity.id,
          key: fieldData.key,
        },
      },
      update: {},
      create: {
        entity_id: supportEntity.id,
        ...fieldData,
      },
    });
  }

  console.log('✅ Created entity fields');

  // Create sample records
  const sampleRecords = [
    {
      title: 'Login issues with mobile app',
      status: 'open',
      priority: 'high',
      description: 'User cannot log in to the mobile application',
      customer_rating: null,
    },
    {
      title: 'Feature request: Dark mode',
      status: 'in_progress',
      priority: 'medium',
      description: 'Customer requested dark mode for better accessibility',
      customer_rating: null,
    },
    {
      title: 'Payment processing error',
      status: 'resolved',
      priority: 'urgent',
      description: 'Customer payment failed during checkout',
      customer_rating: 5,
    },
  ];

  for (const recordData of sampleRecords) {
    await prisma.entityRecord.create({
      data: {
        tenant_id: tenant.id,
        entity_id: supportEntity.id,
        fields: JSON.stringify(recordData),
        created_by: adminUser.id,
      },
    });
  }

  console.log('✅ Created sample records');

  // Create sample dashboard
  const dashboard = await prisma.dashboard.upsert({
    where: {
      tenant_id_slug: {
        tenant_id: tenant.id,
        slug: 'support-overview',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Support Overview',
      slug: 'support-overview',
      is_public: false,
      created_by: adminUser.id,
    },
  });

  console.log('✅ Created dashboard:', dashboard.name);

  // Create sample widgets
  const widgets = [
    {
      type: 'kpi',
      title: 'Total Tickets',
      config: {
        entity_slug: 'support-tickets',
        metric_type: 'count',
      },
    },
    {
      type: 'pie',
      title: 'Tickets by Status',
      config: {
        entity_slug: 'support-tickets',
        metric_type: 'count',
        group_by: 'status',
      },
    },
    {
      type: 'bar',
      title: 'Tickets by Priority',
      config: {
        entity_slug: 'support-tickets',
        metric_type: 'count',
        group_by: 'priority',
      },
    },
  ];

  for (const widgetData of widgets) {
    await prisma.widget.create({
      data: {
        dashboard_id: dashboard.id,
        entity_id: supportEntity.id,
        type: widgetData.type as any,
        title: widgetData.title,
        config: JSON.stringify(widgetData.config),
        is_public: false,
      },
    });
  }

  console.log('✅ Created sample widgets');

  console.log('🎉 Database seeding completed!');
  console.log(`
Demo credentials:
- Email: admin@demo.com
- Tenant: demo
- API Key: sk_${apiKeyHash.substring(0, 8)}...
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
