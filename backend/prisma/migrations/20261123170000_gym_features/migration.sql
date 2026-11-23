-- FitPlus-style plan defaults + per-gym feature toggles
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "defaultFeatureKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "GymFeatureToggle" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GymFeatureToggle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GymFeatureToggle_gymId_featureKey_key" ON "GymFeatureToggle"("gymId", "featureKey");
CREATE INDEX IF NOT EXISTS "GymFeatureToggle_gymId_idx" ON "GymFeatureToggle"("gymId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GymFeatureToggle_gymId_fkey'
  ) THEN
    ALTER TABLE "GymFeatureToggle"
      ADD CONSTRAINT "GymFeatureToggle_gymId_fkey"
      FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
