import { Router } from 'express';
import {
  authenticateAdmin,
  requirePermission,
} from '../../../middleware/auth.js';
import * as authController from '../../../controllers/v1/shared/authController.js';
import * as gymController from '../../../controllers/v1/admin/gymController.js';
import * as billingController from '../../../controllers/v1/admin/billingController.js';
import * as platformUserController from '../../../controllers/v1/admin/platformUserController.js';
import accessCatalogRoutes from '../accessCatalog.js';

const router = Router();

router.post('/auth/login', authController.adminLogin);
router.post('/auth/verify-2fa', authController.adminVerify2fa);

router.use(authenticateAdmin);

router.post('/auth/logout', authController.adminLogout);
router.get('/auth/me', authController.adminMe);
router.get('/dashboard', gymController.dashboard);

router.get(
  '/users',
  requirePermission('users.view'),
  platformUserController.listUsers
);
router.get(
  '/users/roles',
  requirePermission('users.view'),
  platformUserController.listRoles
);
router.post(
  '/users',
  requirePermission('users.manage'),
  platformUserController.createUser
);
router.patch(
  '/users/:id',
  requirePermission('users.manage'),
  platformUserController.updateUser
);
router.patch(
  '/users/:id/require-email-otp',
  requirePermission('users.manage'),
  platformUserController.setRequireEmailOtp
);
router.delete(
  '/users/:id',
  requirePermission('users.manage'),
  platformUserController.deleteUser
);

router.get('/gyms', requirePermission('gyms.view'), gymController.listGyms);
router.post('/gyms', requirePermission('gyms.create'), gymController.createGym);
router.get(
  '/gyms/:id/features',
  requirePermission('gyms.view'),
  gymController.getGymFeatures
);
router.patch(
  '/gyms/:id/features',
  requirePermission('gym_features.manage'),
  gymController.setGymFeatures
);
router.patch('/gyms/:id', requirePermission('gyms.update'), gymController.updateGym);
router.delete('/gyms/:id', requirePermission('gyms.delete'), gymController.deleteGym);

router.get('/plans', requirePermission('billing.view'), billingController.listPlans);
router.post('/plans', requirePermission('billing.manage'), billingController.createPlan);
router.patch(
  '/plans/:id',
  requirePermission('billing.manage'),
  billingController.updatePlan
);
router.delete(
  '/plans/:id',
  requirePermission('billing.manage'),
  billingController.deletePlan
);

router.get('/invoices', requirePermission('billing.view'), billingController.listInvoices);
router.post(
  '/invoices',
  requirePermission('billing.manage'),
  billingController.createInvoice
);
router.post(
  '/invoices/:id/pay',
  requirePermission('billing.manage'),
  billingController.markPaid
);
router.post(
  '/billing/advance',
  requirePermission('billing.manage'),
  billingController.advanceBilling
);

router.use('/access', requirePermission('access.manage'), accessCatalogRoutes);

export default router;
