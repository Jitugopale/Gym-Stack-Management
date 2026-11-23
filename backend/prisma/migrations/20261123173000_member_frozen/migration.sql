-- FitPlus-style freeze (pause access; end date unchanged)
ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'frozen';
