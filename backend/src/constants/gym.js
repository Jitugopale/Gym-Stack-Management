/** Slim FitPlus billing rules */
export const GYM_BILLING = {
  GRACE_DAYS: 7,
  SOFT_LOCK_DAYS: 7,
  TRIAL_DAYS: 15,
};

export const GYM_STATUS = {
  ACTIVE: 'active',
  GRACE: 'grace',
  SOFT_LOCK: 'soft_lock',
  LOGIN_BLOCKED: 'login_blocked',
};

export const GYM_WRITE_BLOCKED_STATUSES = [
  GYM_STATUS.SOFT_LOCK,
  GYM_STATUS.LOGIN_BLOCKED,
];

export const GYM_LOGIN_BLOCKED_STATUSES = [GYM_STATUS.LOGIN_BLOCKED];

/**
 * Feature catalog SA toggles per gym.
 * Enabled features unlock the listed permission keys for that gym.
 */
export const GYM_FEATURE_CATALOG = [
  {
    featureKey: 'dashboard',
    label: 'Dashboard',
    isCore: true,
    defaultEnabled: true,
    permissions: ['dashboard.view'],
  },
  {
    featureKey: 'members',
    label: 'Members',
    isCore: true,
    defaultEnabled: true,
    // plans.view so member forms can load plan options even when Plans module is off
    permissions: [
      'members.view',
      'members.create',
      'members.update',
      'members.delete',
      'plans.view',
    ],
  },
  {
    featureKey: 'plans',
    label: 'Membership plans',
    isCore: false,
    defaultEnabled: true,
    permissions: [
      'plans.view',
      'plans.create',
      'plans.update',
      'plans.delete',
    ],
  },
  {
    featureKey: 'payments',
    label: 'Payments',
    isCore: true,
    defaultEnabled: true,
    permissions: ['payments.view', 'payments.create'],
  },
  {
    featureKey: 'staff',
    label: 'Staff',
    isCore: false,
    defaultEnabled: true,
    permissions: ['staff.view', 'staff.manage'],
  },
  {
    featureKey: 'billing',
    label: 'Cloud billing',
    isCore: true,
    defaultEnabled: true,
    permissions: ['gym_billing.view'],
  },
];

/** Tier packs — Core < Basic < Premium (FitPlus naming) */
const CORE_FEATURE_KEYS = ['dashboard', 'members', 'payments', 'billing'];
const BASIC_FEATURE_KEYS = [...CORE_FEATURE_KEYS, 'plans', 'staff'];
const PREMIUM_FEATURE_KEYS = [...BASIC_FEATURE_KEYS];

export const CLOUD_SUBSCRIPTION_PLANS = [
  {
    key: 'core_monthly',
    name: 'Core Monthly',
    durationMonths: 1,
    priceInr: 999,
    sortOrder: 1,
    defaultFeatureKeys: CORE_FEATURE_KEYS,
  },
  {
    key: 'core_quarterly',
    name: 'Core Quarterly',
    durationMonths: 3,
    priceInr: 2799,
    sortOrder: 2,
    defaultFeatureKeys: CORE_FEATURE_KEYS,
  },
  {
    key: 'basic_monthly',
    name: 'Basic Monthly',
    durationMonths: 1,
    priceInr: 1499,
    sortOrder: 3,
    defaultFeatureKeys: BASIC_FEATURE_KEYS,
  },
  {
    key: 'premium_yearly',
    name: 'Premium Yearly',
    durationMonths: 12,
    priceInr: 9999,
    sortOrder: 4,
    defaultFeatureKeys: PREMIUM_FEATURE_KEYS,
  },
];

export const DEFAULT_GYM_FEATURES = GYM_FEATURE_CATALOG.map((feature) => ({
  featureKey: feature.featureKey,
  isEnabled: feature.defaultEnabled !== false,
}));

export const GYM_FEATURE_KEYS = GYM_FEATURE_CATALOG.map((f) => f.featureKey);

/** Resolve create-gym feature toggles from plan defaults (falls back to catalog). */
export function featuresFromPlanDefaults(plan) {
  const keys = Array.isArray(plan?.defaultFeatureKeys) ? plan.defaultFeatureKeys : [];
  if (!keys.length) return DEFAULT_GYM_FEATURES;
  const enabled = new Set(keys);
  return GYM_FEATURE_CATALOG.map((feature) => ({
    featureKey: feature.featureKey,
    isEnabled: enabled.has(feature.featureKey),
  }));
}

/** Resolve enabled permission keys for a gym from feature toggles */
export function permissionsFromFeatureToggles(featureToggles = []) {
  const byKey = new Map(
    (featureToggles || []).map((row) => [row.featureKey, row.isEnabled !== false])
  );
  const allowed = new Set();

  for (const feature of GYM_FEATURE_CATALOG) {
    const enabled = byKey.has(feature.featureKey)
      ? byKey.get(feature.featureKey)
      : feature.defaultEnabled !== false;
    if (!enabled) continue;
    for (const key of feature.permissions) allowed.add(key);
  }

  return [...allowed];
}

export function catalogFeaturesForGym(featureToggles = []) {
  return GYM_FEATURE_CATALOG.map((feature) => ({
    featureKey: feature.featureKey,
    label: feature.label,
    isCore: feature.isCore,
    isEnabled:
      (featureToggles || []).find((row) => row.featureKey === feature.featureKey)
        ?.isEnabled ?? feature.defaultEnabled !== false,
  }));
}
