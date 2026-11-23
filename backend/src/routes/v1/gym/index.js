import { Router } from 'express';
import {
  authenticateGym,
  requirePermission,
} from '../../../middleware/auth.js';
import { resolveGymContext } from '../../../middleware/gymContext.js';
import { requireGymWritable } from '../../../middleware/gymAccess.js';
import * as authController from '../../../controllers/v1/shared/authController.js';
import * as resourceController from '../../../controllers/v1/gym/resourceController.js';
import * as billingController from '../../../controllers/v1/gym/billingController.js';

const router = Router();

router.get('/public/:slug', resourceController.publicGym);
router.post('/:slug/auth/login', authController.gymLogin);
router.post('/:slug/auth/verify-2fa', authController.gymVerify2fa);

router.use(authenticateGym, resolveGymContext);

router.post('/auth/logout', authController.gymLogout);
router.get('/auth/me', authController.gymMe);
router.get('/dashboard', requirePermission('dashboard.view'), resourceController.dashboard);
router.get('/billing', requirePermission('gym_billing.view'), billingController.billingStatus);

router.get('/staff', requirePermission('staff.view'), resourceController.listStaff);
router.post(
  '/staff',
  requirePermission('staff.manage'),
  requireGymWritable,
  resourceController.createStaff
);
router.patch(
  '/staff/:id/require-email-otp',
  requirePermission('staff.manage'),
  requireGymWritable,
  resourceController.setStaffRequireEmailOtp
);
router.delete(
  '/staff/:id',
  requirePermission('staff.manage'),
  requireGymWritable,
  resourceController.deleteStaff
);

router.get('/members', requirePermission('members.view'), resourceController.listMembers);
router.post(
  '/members',
  requirePermission('members.create'),
  requireGymWritable,
  resourceController.createMember
);
router.post(
  '/members/:id/renew',
  requirePermission('members.update'),
  requireGymWritable,
  resourceController.renewMember
);
router.patch(
  '/members/:id',
  requirePermission('members.update'),
  requireGymWritable,
  resourceController.updateMember
);
router.delete(
  '/members/:id',
  requirePermission('members.delete'),
  requireGymWritable,
  resourceController.deleteMember
);

router.get('/plans', requirePermission('plans.view'), resourceController.listPlans);
router.post(
  '/plans',
  requirePermission('plans.create'),
  requireGymWritable,
  resourceController.createPlan
);
router.patch(
  '/plans/:id',
  requirePermission('plans.update'),
  requireGymWritable,
  resourceController.updatePlan
);
router.delete(
  '/plans/:id',
  requirePermission('plans.delete'),
  requireGymWritable,
  resourceController.deletePlan
);

router.get('/payments', requirePermission('payments.view'), resourceController.listPayments);
router.post(
  '/payments',
  requirePermission('payments.create'),
  requireGymWritable,
  resourceController.createPayment
);

export default router;
