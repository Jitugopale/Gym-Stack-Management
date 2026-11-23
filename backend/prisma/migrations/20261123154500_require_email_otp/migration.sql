-- FitPlus-style per-membership 2FA flags (true/false in DB)
ALTER TABLE "PlatformUser" ADD COLUMN IF NOT EXISTS "requireEmailOtp" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "GymUser" ADD COLUMN IF NOT EXISTS "requireEmailOtp" BOOLEAN NOT NULL DEFAULT false;
