import { Router } from 'express';
import * as accessCatalogController from '../../controllers/v1/shared/accessCatalogController.js';

const router = Router();

router.get('/modules', accessCatalogController.listModules);
router.post('/modules', accessCatalogController.createModule);
router.patch('/modules/:id', accessCatalogController.updateModule);
router.delete('/modules/:id', accessCatalogController.deleteModule);

router.get('/actions', accessCatalogController.listActions);
router.post('/actions', accessCatalogController.createAction);
router.patch('/actions/:id', accessCatalogController.updateAction);
router.delete('/actions/:id', accessCatalogController.deleteAction);

router.get('/permissions', accessCatalogController.listPermissions);
router.post('/permissions', accessCatalogController.createPermission);
router.patch('/permissions/:id', accessCatalogController.updatePermission);
router.delete('/permissions/:id', accessCatalogController.deletePermission);

router.get('/roles', accessCatalogController.listRoles);
router.post('/roles', accessCatalogController.createRole);
router.patch('/roles/:id', accessCatalogController.updateRole);
router.patch('/roles/:id/permissions', accessCatalogController.updateRolePermissions);
router.delete('/roles/:id', accessCatalogController.deleteRole);

export default router;
