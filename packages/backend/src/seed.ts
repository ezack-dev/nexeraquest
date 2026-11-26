import { prisma } from './prisma.js';
import { seedAll } from './seedCore.js';

seedAll({ reset: true })
  .then(() => {
    console.log('🎉 Seed completed successfully!\n');
  })
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
