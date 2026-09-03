import { PrismaClient, Plan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@codemind.dev';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = 'CodeMind Administrator';

  // Check if admin user already exists
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        name: adminName,
      },
    });
    console.log(`✔ Created admin user: ${admin.email} (ID: ${admin.id})`);
  } else {
    console.log(`ℹ Admin user ${admin.email} already exists.`);
  }

  // Ensure default preference exists for the admin
  const existingPreference = await prisma.preference.findUnique({
    where: { userId: admin.id },
  });

  if (!existingPreference) {
    await prisma.preference.create({
      data: {
        userId: admin.id,
        theme: 'dark',
        fontSize: 14,
        fontFamily: 'JetBrains Mono',
        aiProvider: 'anthropic',
        defaultLanguage: 'typescript',
      },
    });
    console.log(`✔ Created default preferences for admin user.`);
  }

  // Ensure default FREE subscription plan exists for the admin
  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId: admin.id },
  });

  if (!existingSubscription) {
    await prisma.subscription.create({
      data: {
        userId: admin.id,
        plan: Plan.FREE,
        status: 'active',
      },
    });
    console.log(`✔ Created default FREE subscription for admin user.`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
