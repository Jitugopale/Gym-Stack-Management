/** Mirrors backend GYM_FEATURE_CATALOG — used for SA plan/gym toggles */
export const GYM_FEATURE_CATALOG = [
  { featureKey: 'dashboard', label: 'Dashboard', isCore: true },
  { featureKey: 'members', label: 'Members', isCore: true },
  { featureKey: 'plans', label: 'Membership plans', isCore: false },
  { featureKey: 'payments', label: 'Payments', isCore: true },
  { featureKey: 'staff', label: 'Staff', isCore: false },
  { featureKey: 'billing', label: 'Cloud billing', isCore: true },
];

export function featuresFromKeys(enabledKeys = []) {
  const enabled = new Set(enabledKeys);
  return GYM_FEATURE_CATALOG.map((f) => ({
    featureKey: f.featureKey,
    isEnabled: enabled.has(f.featureKey),
  }));
}

export function keysFromFeatures(features = []) {
  return features.filter((f) => f.isEnabled !== false).map((f) => f.featureKey);
}
