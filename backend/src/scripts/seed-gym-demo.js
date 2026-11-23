/**
 * Gym + SA demo seed — one file, idempotent (FitPlus-style).
 *
 * After `pnpm seed` (platform users / roles / catalogs). Does NOT recreate Super Admin.
 * Ensures cloud plans from CLOUD_SUBSCRIPTION_PLANS if missing.
 *
 * Scenarios:
 *   iron-peak     — Core Monthly · paid / active · rich desk data
 *   city-strength — Core Quarterly · active trial window
 *   lockfit       — Basic Monthly · soft_lock + unpaid invoice · owner 2FA on
 *   peak-power    — Core Monthly · grace + pending invoice
 *   titan-gym     — Premium Yearly · login_blocked
 *
 * Usage (backend root):
 *   pnpm seed
 *   pnpm run seed:gym-demo
 *   node src/scripts/seed-gym-demo.js --gym=iron-peak
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import config from '../config/env.js';
import {
  CLOUD_SUBSCRIPTION_PLANS,
  GYM_BILLING,
  GYM_STATUS,
  featuresFromPlanDefaults,
} from '../constants/gym.js';
import { DEMO_PASSWORD } from '../constants/seed.js';
import * as invoiceService from '../services/admin/gymInvoiceService.js';

const TAG = '[seed-demo]';

const SA_STAFF = {
  email: 'staff@gymstack.local',
  name: 'Platform Staff',
};

/** @type {Array<{ slug: string, name: string, city: string, planKey: string, billing: string, requireOwner2fa?: boolean, rich?: boolean, staffSlot: number }>} */
const GYM_DEFS = [
  {
    slug: 'iron-peak',
    name: 'Iron Peak Gym',
    city: 'Pune',
    planKey: 'core_monthly',
    billing: 'paid',
    requireOwner2fa: false,
    rich: true,
    staffSlot: 1,
  },
  {
    slug: 'city-strength',
    name: 'City Strength',
    city: 'Mumbai',
    planKey: 'core_quarterly',
    billing: 'trial',
    requireOwner2fa: false,
    rich: true,
    staffSlot: 2,
  },
  {
    slug: 'lockfit',
    name: 'LockFit Studio',
    city: 'Nagpur',
    planKey: 'basic_monthly',
    billing: 'soft_lock',
    requireOwner2fa: true,
    rich: false,
    staffSlot: 3,
  },
  {
    slug: 'peak-power',
    name: 'Peak Power',
    city: 'Nashik',
    planKey: 'core_monthly',
    billing: 'grace',
    requireOwner2fa: false,
    rich: true,
    staffSlot: 4,
  },
  {
    slug: 'titan-gym',
    name: 'Titan Gym',
    city: 'Thane',
    planKey: 'premium_yearly',
    billing: 'login_blocked',
    requireOwner2fa: false,
    rich: false,
    staffSlot: 5,
  },
];

const args = process.argv.slice(2);
const gymFilter = (args.find((a) => a.startsWith('--gym=')) || '').slice(
  '--gym='.length
);

function utcDay(offsetDays = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

function utcDateTime(offsetDays = 0, hour = 12) {
  const d = utcDay(offsetDays);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

function ownerEmail(slug) {
  return `owner@${slug}.local`;
}

function staffEmail(slug) {
  return `staff@${slug}.local`;
}

function demoMemberEmail(slug, n) {
  return `demo.member${n}@${slug}.local`;
}

async function requireRoles() {
  const keys = [
    'super_admin',
    'super_admin_staff',
    'gym_owner',
    'gym_staff',
  ];
  const roles = await prisma.role.findMany({ where: { key: { in: keys } } });
  const byKey = Object.fromEntries(roles.map((r) => [r.key, r]));
  for (const key of keys) {
    if (!byKey[key]) throw new Error(`Role ${key} missing — run: pnpm seed`);
  }
  return byKey;
}

async function ensureSaUser() {
  const sa = await prisma.user.findUnique({
    where: { email: 'admin@gymstack.local' },
    include: { platformUser: true },
  });
  if (!sa?.platformUser) {
    throw new Error('Super Admin missing — run: pnpm seed');
  }
  return sa;
}

async function ensureSaStaff(roles, passwordHash) {
  let user = await prisma.user.findUnique({
    where: { email: SA_STAFF.email },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: SA_STAFF.email,
        name: SA_STAFF.name,
        passwordHash,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: SA_STAFF.name, passwordHash },
    });
  }

  await prisma.platformUser.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      roleId: roles.super_admin_staff.id,
    },
    update: { roleId: roles.super_admin_staff.id },
  });

  return user;
}

async function ensureSubscriptionPlans() {
  const byKey = {};
  for (const row of CLOUD_SUBSCRIPTION_PLANS) {
    byKey[row.key] = await prisma.subscriptionPlan.upsert({
      where: { key: row.key },
      update: {
        name: row.name,
        durationMonths: row.durationMonths,
        priceInr: row.priceInr,
        sortOrder: row.sortOrder,
        isActive: true,
        defaultFeatureKeys: row.defaultFeatureKeys || [],
      },
      create: row,
    });
  }
  return byKey;
}

async function ensureGymFeatures(gymId, plan) {
  const rows = featuresFromPlanDefaults(plan);
  for (const row of rows) {
    await prisma.gymFeatureToggle.upsert({
      where: {
        gymId_featureKey: { gymId, featureKey: row.featureKey },
      },
      create: {
        gymId,
        featureKey: row.featureKey,
        isEnabled: row.isEnabled !== false,
      },
      // Keep existing SA overrides on re-seed
      update: {},
    });
  }
}

async function ensureGym(def, plan) {
  let gym = await prisma.gym.findUnique({ where: { slug: def.slug } });

  if (!gym) {
    gym = await prisma.gym.create({
      data: {
        name: def.name,
        slug: def.slug,
        requireOwner2fa: Boolean(def.requireOwner2fa),
        status: GYM_STATUS.ACTIVE,
        subscriptionPlanId: plan.id,
        periodEndsAt: utcDay(20),
      },
    });
    console.log(
      `  created gym ${gym.slug} · plan ${plan.key} · city ${def.city}`
    );
  } else {
    gym = await prisma.gym.update({
      where: { id: gym.id },
      data: {
        name: def.name,
        requireOwner2fa: Boolean(def.requireOwner2fa),
        subscriptionPlanId: plan.id,
      },
    });
    console.log(`  gym ${gym.slug} exists — applying billing scenario ${def.billing}`);
  }

  await ensureGymFeatures(gym.id, plan);

  return prisma.gym.findUnique({
    where: { id: gym.id },
    include: { subscriptionPlan: true },
  });
}

async function ensureGymPeople(gym, def, roles, passwordHash) {
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail(def.slug) },
    update: {
      name: `${def.name} Owner`,
      passwordHash,
    },
    create: {
      email: ownerEmail(def.slug),
      name: `${def.name} Owner`,
      passwordHash,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: staffEmail(def.slug) },
    update: {
      name: `${def.name} Staff`,
      passwordHash,
    },
    create: {
      email: staffEmail(def.slug),
      name: `${def.name} Staff`,
      passwordHash,
    },
  });

  await prisma.gymUser.upsert({
    where: { userId_gymId: { userId: owner.id, gymId: gym.id } },
    update: {
      roleId: roles.gym_owner.id,
      requireEmailOtp: Boolean(def.requireOwner2fa),
    },
    create: {
      userId: owner.id,
      gymId: gym.id,
      roleId: roles.gym_owner.id,
      requireEmailOtp: Boolean(def.requireOwner2fa),
    },
  });

  await prisma.gymUser.upsert({
    where: { userId_gymId: { userId: staff.id, gymId: gym.id } },
    update: { roleId: roles.gym_staff.id, requireEmailOtp: false },
    create: {
      userId: staff.id,
      gymId: gym.id,
      roleId: roles.gym_staff.id,
      requireEmailOtp: false,
    },
  });

  return { owner, staff };
}

async function voidOpenInvoices(gymId) {
  await prisma.gymInvoice.updateMany({
    where: {
      gymId,
      status: { in: ['pending', 'overdue'] },
    },
    data: { status: 'cancelled', note: `${TAG} voided` },
  });
}

async function ensureOpenInvoice(gym) {
  const open = await prisma.gymInvoice.findFirst({
    where: {
      gymId: gym.id,
      status: { in: ['pending', 'overdue'] },
    },
  });
  if (open) return open;
  return invoiceService.createRenewalInvoice(gym.id, { sendEmail: false });
}

async function applyGymBilling(gym, def) {
  const billing = def.billing;

  if (billing === 'trial') {
    await voidOpenInvoices(gym.id);
    const trialEndsAt = utcDay(GYM_BILLING.TRIAL_DAYS);
    await prisma.gym.update({
      where: { id: gym.id },
      data: {
        status: GYM_STATUS.ACTIVE,
        periodEndsAt: trialEndsAt,
        graceEndsAt: null,
        softLockEndsAt: null,
      },
    });
    console.log(`  → trial until ${trialEndsAt.toISOString().slice(0, 10)}`);
    return;
  }

  if (billing === 'paid') {
    await prisma.gym.update({
      where: { id: gym.id },
      data: {
        status: GYM_STATUS.ACTIVE,
        periodEndsAt: utcDay(25),
        graceEndsAt: null,
        softLockEndsAt: null,
      },
    });
    const invoice = await ensureOpenInvoice(gym);
    if (invoice.status !== 'paid') {
      await invoiceService.markInvoicePaid(invoice.id);
    }
    console.log('  → invoice marked paid · active period');
    return;
  }

  if (billing === 'grace') {
    const periodEndsAt = utcDay(-3);
    const graceEndsAt = utcDay(-3 + GYM_BILLING.GRACE_DAYS);
    const softLockEndsAt = utcDay(
      -3 + GYM_BILLING.GRACE_DAYS + GYM_BILLING.SOFT_LOCK_DAYS
    );
    await prisma.gym.update({
      where: { id: gym.id },
      data: {
        status: GYM_STATUS.GRACE,
        periodEndsAt,
        graceEndsAt,
        softLockEndsAt,
      },
    });
    const invoice = await ensureOpenInvoice(gym);
    await prisma.gymInvoice.update({
      where: { id: invoice.id },
      data: {
        dueDate: periodEndsAt,
        status: 'pending',
        note: `${TAG} grace renewal`,
      },
    });
    console.log('  → grace + pending invoice');
    return;
  }

  if (billing === 'soft_lock') {
    const periodEndsAt = utcDay(-(GYM_BILLING.GRACE_DAYS + 3));
    const graceEndsAt = utcDay(-3);
    const softLockEndsAt = utcDay(GYM_BILLING.SOFT_LOCK_DAYS - 3);
    await prisma.gym.update({
      where: { id: gym.id },
      data: {
        status: GYM_STATUS.SOFT_LOCK,
        periodEndsAt,
        graceEndsAt,
        softLockEndsAt,
      },
    });
    const invoice = await ensureOpenInvoice(gym);
    await prisma.gymInvoice.update({
      where: { id: invoice.id },
      data: {
        dueDate: periodEndsAt,
        status: 'overdue',
        note: `${TAG} soft_lock overdue`,
      },
    });
    console.log('  → soft_lock + overdue invoice');
    return;
  }

  if (billing === 'login_blocked') {
    const periodEndsAt = utcDay(
      -(GYM_BILLING.GRACE_DAYS + GYM_BILLING.SOFT_LOCK_DAYS + 5)
    );
    const graceEndsAt = utcDay(-(GYM_BILLING.SOFT_LOCK_DAYS + 5));
    const softLockEndsAt = utcDay(-5);
    await prisma.gym.update({
      where: { id: gym.id },
      data: {
        status: GYM_STATUS.LOGIN_BLOCKED,
        periodEndsAt,
        graceEndsAt,
        softLockEndsAt,
      },
    });
    const invoice = await ensureOpenInvoice(gym);
    await prisma.gymInvoice.update({
      where: { id: invoice.id },
      data: {
        dueDate: periodEndsAt,
        status: 'overdue',
        note: `${TAG} login_blocked overdue`,
      },
    });
    console.log('  → login_blocked + overdue invoice');
  }
}

async function clearDemoData(gymId, slug) {
  const demoMembers = await prisma.member.findMany({
    where: {
      gymId,
      OR: [
        { email: { startsWith: 'demo.member' } },
        { email: { endsWith: `@${slug}.local` } },
      ],
    },
    select: { id: true },
  });
  const memberIds = demoMembers.map((m) => m.id);

  if (memberIds.length) {
    await prisma.payment.deleteMany({
      where: { gymId, memberId: { in: memberIds } },
    });
    await prisma.member.deleteMany({ where: { id: { in: memberIds } } });
  }

  await prisma.payment.deleteMany({
    where: { gymId, note: { contains: TAG } },
  });
  await prisma.membershipPlan.deleteMany({
    where: { gymId, name: { startsWith: 'Demo ' } },
  });
}

async function ensureCatalog(gymId) {
  const monthly =
    (await prisma.membershipPlan.findFirst({
      where: { gymId, name: 'Demo Monthly' },
    })) ||
    (await prisma.membershipPlan.create({
      data: {
        gymId,
        name: 'Demo Monthly',
        durationDays: 30,
        price: 1999,
        isActive: true,
      },
    }));

  const quarterly =
    (await prisma.membershipPlan.findFirst({
      where: { gymId, name: 'Demo Quarterly' },
    })) ||
    (await prisma.membershipPlan.create({
      data: {
        gymId,
        name: 'Demo Quarterly',
        durationDays: 90,
        price: 4999,
        isActive: true,
      },
    }));

  const yearly =
    (await prisma.membershipPlan.findFirst({
      where: { gymId, name: 'Demo Yearly' },
    })) ||
    (await prisma.membershipPlan.create({
      data: {
        gymId,
        name: 'Demo Yearly',
        durationDays: 365,
        price: 14999,
        isActive: true,
      },
    }));

  return { monthly, quarterly, yearly };
}

async function createMemberBundle({
  gymId,
  plan,
  name,
  email,
  phone,
  status,
  startOffset,
  endOffset,
  orderAmount,
  paidAmount = null,
  method = 'cash',
  paidAtOffset = 0,
}) {
  const member = await prisma.member.create({
    data: {
      gymId,
      planId: plan.id,
      name,
      email,
      phone,
      status,
      startDate: utcDay(startOffset),
      endDate: utcDay(endOffset),
    },
  });

  let payment = null;
  if (paidAmount != null && paidAmount > 0) {
    payment = await prisma.payment.create({
      data: {
        gymId,
        memberId: member.id,
        planId: plan.id,
        amount: paidAmount,
        method,
        paidAt: utcDateTime(paidAtOffset, 14),
        note: `${TAG} membership ${status}`,
      },
    });
  }

  return { member, payment, orderAmount };
}

async function seedMembers(gymId, slug, staffSlot, { monthly, quarterly, yearly }) {
  const rows = [];
  const phone = (n) => `9${String(staffSlot)}${String(n).padStart(8, '0')}`;

  for (let i = 1; i <= 5; i += 1) {
    rows.push(
      await createMemberBundle({
        gymId,
        plan: monthly,
        name: `Active Member ${i}`,
        email: demoMemberEmail(slug, 100 + i),
        phone: phone(100 + i),
        status: 'active',
        startOffset: -20,
        endOffset: 40,
        orderAmount: 1999,
        paidAmount: 1999,
        paidAtOffset: -18,
      })
    );
  }

  for (let i = 1; i <= 2; i += 1) {
    rows.push(
      await createMemberBundle({
        gymId,
        plan: monthly,
        name: `New Joiner ${i}`,
        email: demoMemberEmail(slug, 200 + i),
        phone: phone(200 + i),
        status: 'active',
        startOffset: 0,
        endOffset: 30,
        orderAmount: 1999,
        paidAmount: 1999,
        paidAtOffset: 1 - i,
        method: 'upi',
      })
    );
  }

  rows.push(
    await createMemberBundle({
      gymId,
      plan: monthly,
      name: 'Expiring Soon',
      email: demoMemberEmail(slug, 301),
      phone: phone(301),
      status: 'active',
      startOffset: -28,
      endOffset: 2,
      orderAmount: 1999,
      paidAmount: 1999,
      paidAtOffset: -27,
    })
  );

  rows.push(
    await createMemberBundle({
      gymId,
      plan: quarterly,
      name: 'Pending Dues Partial',
      email: demoMemberEmail(slug, 401),
      phone: phone(401),
      status: 'active',
      startOffset: -10,
      endOffset: 80,
      orderAmount: 4999,
      paidAmount: 1500,
      paidAtOffset: -9,
      method: 'upi',
    })
  );

  rows.push(
    await createMemberBundle({
      gymId,
      plan: yearly,
      name: 'Yearly Active',
      email: demoMemberEmail(slug, 450),
      phone: phone(450),
      status: 'active',
      startOffset: -40,
      endOffset: 325,
      orderAmount: 14999,
      paidAmount: 14999,
      paidAtOffset: -40,
      method: 'upi',
    })
  );

  rows.push(
    await createMemberBundle({
      gymId,
      plan: monthly,
      name: 'Expired Member',
      email: demoMemberEmail(slug, 501),
      phone: phone(501),
      status: 'expired',
      startOffset: -60,
      endOffset: -5,
      orderAmount: 1999,
      paidAmount: 1999,
      paidAtOffset: -55,
    })
  );

  rows.push(
    await createMemberBundle({
      gymId,
      plan: monthly,
      name: 'Cancelled Member',
      email: demoMemberEmail(slug, 601),
      phone: phone(601),
      status: 'cancelled',
      startOffset: -40,
      endOffset: -1,
      orderAmount: 1999,
      paidAmount: 1999,
      paidAtOffset: -39,
    })
  );

  return rows;
}

async function seedIncomeSeries(gymId, members) {
  // Sparse misc payments only — membership period pay is on create/renew, not daily
  const payers = members
    .filter((r) => r.member.status === 'active')
    .slice(0, 3);
  if (!payers.length) return;

  for (const day of [-12, -5, -1]) {
    const pick = payers[Math.abs(day) % payers.length];
    await prisma.payment.create({
      data: {
        gymId,
        memberId: pick.member.id,
        planId: pick.member.planId,
        amount: 200 + (Math.abs(day) % 5) * 100,
        method: day % 2 === 0 ? 'cash' : 'upi',
        paidAt: utcDateTime(day, 11 + (Math.abs(day) % 6)),
        note: `${TAG} chart income`,
      },
    });
  }
}

async function seedOneGym(def, plan, roles, passwordHash) {
  console.log(`\n${TAG} gym ${def.slug} (${def.billing} · ${def.planKey})…`);
  const gym = await ensureGym(def, plan);
  await ensureGymPeople(gym, def, roles, passwordHash);
  await applyGymBilling(gym, def);
  await clearDemoData(gym.id, def.slug);
  const catalog = await ensureCatalog(gym.id);
  const members = await seedMembers(gym.id, def.slug, def.staffSlot, catalog);
  if (def.rich !== false) {
    await seedIncomeSeries(gym.id, members);
  }

  return prisma.gym.findUnique({
    where: { id: gym.id },
    include: { subscriptionPlan: true },
  });
}

async function main() {
  const defs = gymFilter
    ? GYM_DEFS.filter((g) => g.slug === gymFilter.toLowerCase())
    : GYM_DEFS;
  if (!defs.length) {
    throw new Error(
      `Unknown --gym=${gymFilter}. Use: ${GYM_DEFS.map((g) => g.slug).join(', ')} (or omit for all).`
    );
  }

  console.log(
    `\n${TAG} seeding demo (${defs.map((d) => d.slug).join(', ')})…`
  );

  const roles = await requireRoles();
  await ensureSaUser();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, config.bcryptRounds);
  await ensureSaStaff(roles, passwordHash);
  const plansByKey = await ensureSubscriptionPlans();

  const gyms = [];
  for (const def of defs) {
    const plan = plansByKey[def.planKey];
    if (!plan) {
      throw new Error(
        `Cloud plan missing: ${def.planKey} — run pnpm seed first`
      );
    }
    gyms.push(await seedOneGym(def, plan, roles, passwordHash));
  }

  const loginLines = gyms
    .map((gym) => {
      const def = GYM_DEFS.find((d) => d.slug === gym.slug);
      return `  /gym/${gym.slug.padEnd(14)} ${String(def.billing).padEnd(14)} plan ${def.planKey}\n    owner ${ownerEmail(def.slug)}  staff ${staffEmail(def.slug)}${def.requireOwner2fa ? '  (owner 2FA on)' : ''}`;
    })
    .join('\n');

  console.log(`
${TAG} done.

SA (from pnpm seed, not recreated):
  Super Admin  admin@gymstack.local
  SA staff     ${SA_STAFF.email}

Password for all demo accounts: ${DEMO_PASSWORD}

Gyms:
${loginLines}

Scenarios: paid · trial · soft_lock · grace · login_blocked.
Re-run anytime; previous ${TAG} desk rows are replaced. Billing scenario is re-applied.
`);
}

main()
  .catch((error) => {
    console.error(TAG, 'failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
