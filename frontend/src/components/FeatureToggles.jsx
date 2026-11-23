import { GYM_FEATURE_CATALOG } from '@/config/gymFeatures';

/**
 * Checkbox grid for FitPlus-style gym/plan feature packs.
 * `value` is Array<{ featureKey, isEnabled }>
 */
export default function FeatureToggles({ value = [], onChange, label = 'Modules' }) {
  const byKey = new Map(value.map((row) => [row.featureKey, row.isEnabled !== false]));

  const toggle = (featureKey) => {
    const next = GYM_FEATURE_CATALOG.map((f) => ({
      featureKey: f.featureKey,
      isEnabled:
        f.featureKey === featureKey
          ? !byKey.get(f.featureKey)
          : byKey.has(f.featureKey)
            ? byKey.get(f.featureKey)
            : false,
    }));
    onChange?.(next);
  };

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-medium text-[var(--text)]">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {GYM_FEATURE_CATALOG.map((f) => {
          const checked = byKey.has(f.featureKey)
            ? byKey.get(f.featureKey)
            : false;
          return (
            <label
              key={f.featureKey}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
            >
              <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={() => toggle(f.featureKey)}
              />
              <span>
                {f.label}
                {f.isCore ? (
                  <span className="ml-1 text-xs opacity-60">core</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
