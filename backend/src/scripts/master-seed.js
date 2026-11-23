/**
 * FitPlus-style master seed CLI.
 * Real logic lives in src/seeders/masterSeeder.js
 *
 * Usage:
 *   pnpm seed
 *   pnpm seed clear
 *   pnpm seed reset
 *   pnpm seed permissions
 *   pnpm seed roles
 *   pnpm seed users
 */
import 'dotenv/config';
import { logger } from '../utils/logger.js';
import MasterSeeder from '../seeders/masterSeeder.js';

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  let command = 'seed';
  let commandFound = false;

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const option = arg.substring(2);
      if (option.startsWith('no-')) {
        options[option.substring(3)] = false;
      } else {
        options[option] = true;
      }
    } else if (!commandFound) {
      command = arg;
      commandFound = true;
    }
  }

  const seeder = new MasterSeeder();

  try {
    switch (command) {
      case 'seed':
        logger.info('Seeding all data...');
        await seeder.seedAll(options);
        break;

      case 'clear':
        logger.info('Clearing seeded RBAC data...');
        await seeder.clearAll(options);
        break;

      case 'reset':
        logger.info('Resetting all data...');
        await seeder.resetAll(options);
        break;

      case 'permissions':
        logger.info('Seeding permissions only...');
        await seeder.connect();
        await seeder.seedModules();
        await seeder.seedActions();
        await seeder.seedPermissions();
        await seeder.disconnect();
        break;

      case 'roles':
        logger.info('Seeding roles only...');
        await seeder.connect();
        await seeder.seedModules();
        await seeder.seedActions();
        await seeder.seedPermissions();
        await seeder.seedRoles();
        await seeder.disconnect();
        break;

      case 'users':
        logger.info('Seeding users only...');
        await seeder.connect();
        await seeder.seedUsers();
        await seeder.disconnect();
        break;

      case 'plans':
        logger.info('Seeding subscription plans only...');
        await seeder.connect();
        await seeder.seedSubscriptionPlans();
        await seeder.disconnect();
        break;

      default:
        console.log(`
Usage: pnpm seed [command] [options]

Commands:
  seed          Seed all data (default)
  clear         Clear seeded RBAC / platform users / plans
  reset         Clear then seed all data
  permissions   Seed modules, actions, permissions
  roles         Seed permissions then roles
  users         Seed users from users.json
  plans         Seed cloud subscription plans

Options:
  --no-permissions    Skip permissions
  --no-roles          Skip roles
  --no-users          Skip users on seed/clear/reset
  --no-plans          Skip subscription plans

Then demo gyms:
  pnpm run seed:gym-demo
  pnpm run seed:gym-demo -- --gym=iron-peak
`);
        process.exit(command === 'help' ? 0 : 1);
    }
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
