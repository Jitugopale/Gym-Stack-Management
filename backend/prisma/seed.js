/**
 * Prisma entrypoint — delegates to FitPlus-style MasterSeeder.
 * Keep this file thin; real logic lives in src/seeders/masterSeeder.js
 */
import 'dotenv/config';
import MasterSeeder from '../src/seeders/masterSeeder.js';

const seeder = new MasterSeeder();

seeder
  .seedAll()
  .then(() => {
    console.log('Seed completed. Next: pnpm run seed:gym-demo');
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
