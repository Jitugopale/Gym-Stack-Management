import * as accessCatalogService from '../../../services/shared/accessCatalogService.js';

function handle(res, next, fn) {
  Promise.resolve(fn())
    .then((data) => res.json(data))
    .catch(next);
}

export const listModules = (req, res, next) =>
  handle(res, next, () => accessCatalogService.listModules());
export const createModule = (req, res, next) =>
  handle(res, next, () => accessCatalogService.createModule(req.body));
export const updateModule = (req, res, next) =>
  handle(res, next, () => accessCatalogService.updateModule(req.params.id, req.body));
export const deleteModule = (req, res, next) =>
  handle(res, next, () => accessCatalogService.deleteModule(req.params.id));

export const listActions = (req, res, next) =>
  handle(res, next, () => accessCatalogService.listActions());
export const createAction = (req, res, next) =>
  handle(res, next, () => accessCatalogService.createAction(req.body));
export const updateAction = (req, res, next) =>
  handle(res, next, () => accessCatalogService.updateAction(req.params.id, req.body));
export const deleteAction = (req, res, next) =>
  handle(res, next, () => accessCatalogService.deleteAction(req.params.id));

export const listPermissions = (req, res, next) =>
  handle(res, next, () => accessCatalogService.listPermissions());
export const createPermission = (req, res, next) =>
  handle(res, next, () => accessCatalogService.createPermission(req.body));
export const updatePermission = (req, res, next) =>
  handle(res, next, () =>
    accessCatalogService.updatePermission(req.params.id, req.body)
  );
export const deletePermission = (req, res, next) =>
  handle(res, next, () => accessCatalogService.deletePermission(req.params.id));

export const listRoles = (req, res, next) =>
  handle(res, next, () => accessCatalogService.listRoles());
export const createRole = (req, res, next) =>
  handle(res, next, () => accessCatalogService.createRole(req.body));
export const updateRole = (req, res, next) =>
  handle(res, next, () => accessCatalogService.updateRole(req.params.id, req.body));
export const updateRolePermissions = (req, res, next) =>
  handle(res, next, () =>
    accessCatalogService.updateRolePermissions(req.params.id, req.body)
  );
export const deleteRole = (req, res, next) =>
  handle(res, next, () => accessCatalogService.deleteRole(req.params.id));
