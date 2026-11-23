import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import config from '../../config/env.js';
import { generateTempPassword } from '../../utils/password.js';
import { sendGymOwnerInvite } from '../shared/mailService.js';
import { ROLE_KEYS } from '../../constants/roles.js';
import {
  GYM_BILLING,
  GYM_STATUS,
  GYM_FEATURE_CATALOG,
  GYM_FEATURE_KEYS,
  featuresFromPlanDefaults,
  catalogFeaturesForGym,
  DEFAULT_GYM_FEATURES,
} from '../../constants/gym.js';

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeFeatureRows(features, plan) {
  let featureRows =
    Array.isArray(features) && features.length
      ? features
      : featuresFromPlanDefaults(plan);
  const allowed = new Set(GYM_FEATURE_KEYS);
  featureRows = featureRows.filter((row) => allowed.has(row.featureKey));
  if (!featureRows.length) featureRows = featuresFromPlanDefaults(plan);

  // Ensure every catalog key is present
  const byKey = new Map(featureRows.map((r) => [r.featureKey, r.isEnabled !== false]));
  return GYM_FEATURE_CATALOG.map((f) => ({
    featureKey: f.featureKey,
    isEnabled: byKey.has(f.featureKey)
      ? byKey.get(f.featureKey)
      : f.defaultEnabled !== false,
  }));
}

export async function listGyms() {
  return prisma.gym.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscriptionPlan: true,
      featureToggles: true,
      _count: { select: { members: true, gymUsers: true, invoices: true } },
    },
  });
}

export async function createGym({
  name,
  slug,
  ownerName,
  ownerEmail,
  requireOwner2fa = false,
  planKey = 'core_monthly',
  trialDays = GYM_BILLING.TRIAL_DAYS,
  features,
}) {
  if (!name || !ownerName || !ownerEmail) {
    const err = new Error('name, ownerName, and ownerEmail are required');
    err.status = 400;
    throw err;
  }

  const finalSlug = (slug || slugify(name)).toLowerCase();
  const existing = await prisma.gym.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    const err = new Error('Slug already exists');
    err.status = 409;
    throw err;
  }

  const email = String(ownerEmail).toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error('Owner email already registered');
    err.status = 409;
    throw err;
  }

  const ownerRole = await prisma.role.findUnique({
    where: { key: ROLE_KEYS.GYM_OWNER },
  });
  if (!ownerRole) {
    const err = new Error('gym_owner role missing — run seed');
    err.status = 500;
    throw err;
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { key: planKey } });
  if (!plan) {
    const err = new Error(`Unknown planKey: ${planKey}`);
    err.status = 400;
    throw err;
  }

  const featureRows = normalizeFeatureRows(features, plan);
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, config.bcryptRounds);
  const periodEndsAt = addDays(new Date(), Number(trialDays) || GYM_BILLING.TRIAL_DAYS);

  const result = await prisma.$transaction(async (tx) => {
    const gym = await tx.gym.create({
      data: {
        name,
        slug: finalSlug,
        requireOwner2fa: Boolean(requireOwner2fa),
        status: GYM_STATUS.ACTIVE,
        subscriptionPlanId: plan.id,
        periodEndsAt,
        featureToggles: {
          create: featureRows.map((f) => ({
            featureKey: f.featureKey,
            isEnabled: f.isEnabled !== false,
          })),
        },
      },
      include: { featureToggles: true, subscriptionPlan: true },
    });

    const user = await tx.user.create({
      data: { email, name: ownerName, passwordHash },
    });

    await tx.gymUser.create({
      data: {
        userId: user.id,
        gymId: gym.id,
        roleId: ownerRole.id,
        requireEmailOtp: Boolean(requireOwner2fa),
      },
    });

    return { gym, user };
  });

  const mail = await sendGymOwnerInvite({
    to: email,
    ownerName,
    gymName: name,
    slug: finalSlug,
    email,
    password: tempPassword,
  });

  return {
    ...result.gym,
    owner: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    },
    invite: {
      emailed: mail.sent,
      temporaryPassword: mail.sent ? undefined : tempPassword,
    },
  };
}

export async function getGymBySlug(slug) {
  return prisma.gym.findUnique({
    where: { slug },
    include: { subscriptionPlan: true },
  });
}

export async function updateGym(id, data) {
  let subscriptionPlanId;
  if (data.planKey) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { key: data.planKey },
    });
    if (!plan) {
      const err = new Error(`Unknown planKey: ${data.planKey}`);
      err.status = 400;
      throw err;
    }
    subscriptionPlanId = plan.id;
  }

  const gym = await prisma.gym.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug.toLowerCase() }),
      ...(typeof data.requireOwner2fa === 'boolean' && {
        requireOwner2fa: data.requireOwner2fa,
      }),
      ...(subscriptionPlanId && { subscriptionPlanId }),
      ...(data.status && { status: data.status }),
    },
    include: { subscriptionPlan: true, featureToggles: true },
  });

  if (typeof data.requireOwner2fa === 'boolean') {
    const ownerRole = await prisma.role.findUnique({
      where: { key: ROLE_KEYS.GYM_OWNER },
    });
    if (ownerRole) {
      await prisma.gymUser.updateMany({
        where: { gymId: id, roleId: ownerRole.id },
        data: { requireEmailOtp: data.requireOwner2fa },
      });
    }
  }

  if (Array.isArray(data.features) && data.features.length) {
    await setGymFeatures(id, data.features);
    return prisma.gym.findUnique({
      where: { id },
      include: { subscriptionPlan: true, featureToggles: true },
    });
  }

  return gym;
}

export async function getGymFeatures(gymId) {
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    include: { featureToggles: true, subscriptionPlan: true },
  });
  if (!gym) {
    const err = new Error('Gym not found');
    err.status = 404;
    throw err;
  }

  await ensureFeatureDefaults(gymId);

  const refreshed = await prisma.gymFeatureToggle.findMany({ where: { gymId } });
  return {
    gymId,
    planKey: gym.subscriptionPlan?.key || null,
    planDefaultFeatureKeys: gym.subscriptionPlan?.defaultFeatureKeys || [],
    catalog: GYM_FEATURE_CATALOG.map(({ featureKey, label, isCore }) => ({
      featureKey,
      label,
      isCore,
    })),
    features: catalogFeaturesForGym(refreshed),
  };
}

export async function setGymFeatures(gymId, features = []) {
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) {
    const err = new Error('Gym not found');
    err.status = 404;
    throw err;
  }

  const allowedKeys = new Set(GYM_FEATURE_KEYS);

  await prisma.$transaction(async (tx) => {
    for (const f of features) {
      if (!allowedKeys.has(f.featureKey)) {
        const err = new Error(`Unknown gym feature: ${f.featureKey}`);
        err.status = 400;
        throw err;
      }
      const enabled = f.isEnabled !== false;
      await tx.gymFeatureToggle.upsert({
        where: {
          gymId_featureKey: { gymId, featureKey: f.featureKey },
        },
        create: {
          gymId,
          featureKey: f.featureKey,
          isEnabled: enabled,
        },
        update: { isEnabled: enabled },
      });
    }
    await ensureFeatureDefaults(gymId, tx);
  });

  return getGymFeatures(gymId);
}

export async function ensureFeatureDefaults(gymId, tx = prisma) {
  const existing = await tx.gymFeatureToggle.findMany({
    where: { gymId },
    select: { featureKey: true },
  });
  const have = new Set(existing.map((row) => row.featureKey));
  const missing = DEFAULT_GYM_FEATURES.filter((row) => !have.has(row.featureKey));
  if (!missing.length) return;
  await tx.gymFeatureToggle.createMany({
    data: missing.map((row) => ({
      gymId,
      featureKey: row.featureKey,
      isEnabled: row.isEnabled !== false,
    })),
  });
}

export async function deleteGym(id) {
  return prisma.gym.delete({ where: { id } });
}

export async function adminDashboard() {
  const [gymCount, memberCount, paymentAgg, pendingInvoices] = await Promise.all([
    prisma.gym.count(),
    prisma.member.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.gymInvoice.count({ where: { status: { in: ['pending', 'overdue'] } } }),
  ]);
  return {
    gyms: gymCount,
    members: memberCount,
    payments: paymentAgg._count,
    revenue: paymentAgg._sum.amount || 0,
    pendingInvoices,
  };
}
