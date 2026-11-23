import api from '@/utils/axiosInstance';

export const listModules = () => api.get('/admin/access/modules').then((r) => r.data);
export const createModule = (body) =>
  api.post('/admin/access/modules', body).then((r) => r.data);
export const updateModule = (id, body) =>
  api.patch(`/admin/access/modules/${id}`, body).then((r) => r.data);
export const deleteModule = (id) =>
  api.delete(`/admin/access/modules/${id}`).then((r) => r.data);

export const listActions = () => api.get('/admin/access/actions').then((r) => r.data);
export const createAction = (body) =>
  api.post('/admin/access/actions', body).then((r) => r.data);
export const updateAction = (id, body) =>
  api.patch(`/admin/access/actions/${id}`, body).then((r) => r.data);
export const deleteAction = (id) =>
  api.delete(`/admin/access/actions/${id}`).then((r) => r.data);

export const listPermissionsCatalog = () =>
  api.get('/admin/access/permissions').then((r) => r.data);
export const createPermission = (body) =>
  api.post('/admin/access/permissions', body).then((r) => r.data);
export const updatePermission = (id, body) =>
  api.patch(`/admin/access/permissions/${id}`, body).then((r) => r.data);
export const deletePermission = (id) =>
  api.delete(`/admin/access/permissions/${id}`).then((r) => r.data);

export const listRoles = () => api.get('/admin/access/roles').then((r) => r.data);
export const createRole = (body) =>
  api.post('/admin/access/roles', body).then((r) => r.data);
export const updateRole = (id, body) =>
  api.patch(`/admin/access/roles/${id}`, body).then((r) => r.data);
export const updateRolePermissions = (id, permissionIds) =>
  api
    .patch(`/admin/access/roles/${id}/permissions`, { permissionIds })
    .then((r) => r.data);
export const deleteRole = (id) =>
  api.delete(`/admin/access/roles/${id}`).then((r) => r.data);
