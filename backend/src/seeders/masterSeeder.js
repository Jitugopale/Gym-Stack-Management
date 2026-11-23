import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { DEMO_PASSWORD } from '../constants/seed.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { CLOUD_SUBSCRIPTION_PLANS } from '../constants/gym.js';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MasterSeeder {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  loadJson(fileName) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, fileName), 'utf8'));
  }

  getUsersData() {
    const usersPath = path.join(__dirname, 'users.json');
    if (!fs.existsSync(usersPath)) {
      throw new Error(
        'Missing src/seeders/users.json — copy users.example.json to users.json'
      );
    }
    return this.loadJson('users.json');
  }

  async seedModules() {
    const data = this.loadJson('modules.json');
    for (const item of data) {
      await this.prisma.module.upsert({
        where: { key: item.key },
        update: { name: item.name },
        create: item,
      });
    }
    logger.info(`Modules seeded: ${data.length}`);
  }

  async seedActions() {
    const data = this.loadJson('actions.json');
    for (const item of data) {
      await this.prisma.action.upsert({
        where: { key: item.key },
        update: { name: item.name },
        create: item,
      });
    }
    logger.info(`Actions seeded: ${data.length}`);
  }

  async seedPermissions() {
    const data = this.loadJson('permissions.json');
    const modules = Object.fromEntries(
      (await this.prisma.module.findMany()).map((m) => [m.key, m.id])
    );
    const actions = Object.fromEntries(
      (await this.prisma.action.findMany()).map((a) => [a.key, a.id])
    );

    for (const item of data) {
      await this.prisma.permission.upsert({
        where: { key: item.key },
        update: { scope: item.scope },
        create: {
          key: item.key,
          scope: item.scope,
          moduleId: modules[item.module],
          actionId: actions[item.action],
        },
      });
    }
    logger.info(`Permissions seeded: ${data.length}`);
  }

  async seedRoles() {
    const data = this.loadJson('roles.json');
    const permissionMap = Object.fromEntries(
      (await this.prisma.permission.findMany()).map((p) => [p.key, p.id])
    );

    for (const role of data) {
      const saved = await this.prisma.role.upsert({
        where: { key: role.key },
        update: { name: role.name, scope: role.scope },
        create: { key: role.key, name: role.name, scope: role.scope },
      });

      await this.prisma.rolePermission.deleteMany({ where: { roleId: saved.id } });
      await this.prisma.rolePermission.createMany({
        data: role.permissions
          .filter((key) => permissionMap[key])
          .map((key) => ({
            roleId: saved.id,
            permissionId: permissionMap[key],
          })),
      });
    }
    logger.info(`Roles seeded: ${data.length}`);
  }

  async seedUsers() {
    const users = this.getUsersData();
    const roles = Object.fromEntries(
      (await this.prisma.role.findMany()).map((r) => [r.key, r])
    );

    for (const item of users) {
      // Plain password only in seeder JSON — DB gets bcrypt hash only
      const passwordHash = await bcrypt.hash(
        item.password || DEMO_PASSWORD,
        config.bcryptRounds
      );
      const user = await this.prisma.user.upsert({
        where: { email: item.email.toLowerCase() },
        update: { name: item.name, passwordHash },
        create: {
          email: item.email.toLowerCase(),
          name: item.name,
          passwordHash,
        },
      });

      const role = roles[item.roleKey];
      if (!role || role.scope !== 'platform') {
        throw new Error(`Invalid platform roleKey: ${item.roleKey}`);
      }

      const requireEmailOtp = item.requireEmailOtp !== false;
      await this.prisma.platformUser.upsert({
        where: { userId: user.id },
        update: { roleId: role.id, requireEmailOtp },
        create: { userId: user.id, roleId: role.id, requireEmailOtp },
      });
    }
    logger.info(`Platform users seeded: ${users.length}`);
  }

  async seedSubscriptionPlans() {
    for (const plan of CLOUD_SUBSCRIPTION_PLANS) {
      await this.prisma.subscriptionPlan.upsert({
        where: { key: plan.key },
        update: {
          name: plan.name,
          durationMonths: plan.durationMonths,
          priceInr: plan.priceInr,
          sortOrder: plan.sortOrder,
          isActive: true,
          defaultFeatureKeys: plan.defaultFeatureKeys || [],
        },
        create: plan,
      });
    }
    logger.info(`Subscription plans seeded: ${CLOUD_SUBSCRIPTION_PLANS.length}`);
  }

  async runSeed(options = {}) {
    const runPermissions = options.permissions !== false;
    const runRoles = options.roles !== false;
    const runUsers = options.users !== false;
    const runPlans = options.plans !== false;

    if (runPermissions) {
      await this.seedModules();
      await this.seedActions();
      await this.seedPermissions();
    }
    if (runRoles) await this.seedRoles();
    if (runUsers) await this.seedUsers();
    if (runPlans) await this.seedSubscriptionPlans();
  }

  async runClear(options = {}) {
    const clearUsers = options.users !== false;
    const clearRoles = options.roles !== false;
    const clearPermissions = options.permissions !== false;
    const clearPlans = options.plans !== false;

    if (clearUsers) {
      await this.prisma.platformUser.deleteMany();
      logger.info('Cleared platform users');
    }
    if (clearRoles) {
      await this.prisma.rolePermission.deleteMany();
      await this.prisma.role.deleteMany();
      logger.info('Cleared roles');
    }
    if (clearPermissions) {
      await this.prisma.permission.deleteMany();
      await this.prisma.module.deleteMany();
      await this.prisma.action.deleteMany();
      logger.info('Cleared permissions / modules / actions');
    }
    if (clearPlans) {
      await this.prisma.subscriptionPlan.deleteMany();
      logger.info('Cleared subscription plans');
    }
  }

  async seedAll(options = {}) {
    await this.connect();
    try {
      await this.runSeed(options);
      logger.info('Seed all completed');
    } finally {
      await this.disconnect();
    }
  }

  async clearAll(options = {}) {
    await this.connect();
    try {
      await this.runClear(options);
      logger.info('Clear all completed');
    } finally {
      await this.disconnect();
    }
  }

  async resetAll(options = {}) {
    logger.info('Starting master reset...');
    await this.connect();
    try {
      await this.runClear(options);
      await this.runSeed(options);
      logger.info('Master reset completed');
    } finally {
      await this.disconnect();
    }
  }
}

export { MasterSeeder };
export default MasterSeeder;
