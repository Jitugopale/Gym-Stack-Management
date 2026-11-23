import prisma from '../../config/database.js';

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function listModules() {
  return prisma.module.findMany({ orderBy: { key: 'asc' } });
}

export async function createModule(body) {
  const key = String(body.key || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  if (!key || !name) throw httpError('key and name are required');
  return prisma.module.create({ data: { key, name } });
}

export async function updateModule(id, body) {
  const data = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.key != null) data.key = String(body.key).trim().toLowerCase();
  return prisma.module.update({ where: { id }, data });
}

export async function deleteModule(id) {
  const linked = await prisma.permission.count({ where: { moduleId: id } });
  if (linked) throw httpError('Module has permissions — remove them first', 409);
  await prisma.module.delete({ where: { id } });
  return { id };
}

export async function listActions() {
  return prisma.action.findMany({ orderBy: { key: 'asc' } });
}

export async function createAction(body) {
  const key = String(body.key || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  if (!key || !name) throw httpError('key and name are required');
  return prisma.action.create({ data: { key, name } });
}

export async function updateAction(id, body) {
  const data = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.key != null) data.key = String(body.key).trim().toLowerCase();
  return prisma.action.update({ where: { id }, data });
}

export async function deleteAction(id) {
  const linked = await prisma.permission.count({ where: { actionId: id } });
  if (linked) throw httpError('Action has permissions — remove them first', 409);
  await prisma.action.delete({ where: { id } });
  return { id };
}

export async function listPermissions() {
  const [permissions, modules, actions] = await Promise.all([
    prisma.permission.findMany({
      include: { module: true, action: true },
      orderBy: { key: 'asc' },
    }),
    listModules(),
    listActions(),
  ]);
  return { permissions, modules, actions };
}

export async function createPermission(body) {
  const moduleId = body.moduleId;
  const actionId = body.actionId;
  const scope = body.scope === 'gym' ? 'gym' : 'platform';
  if (!moduleId || !actionId) throw httpError('moduleId and actionId are required');

  const [mod, act] = await Promise.all([
    prisma.module.findUnique({ where: { id: moduleId } }),
    prisma.action.findUnique({ where: { id: actionId } }),
  ]);
  if (!mod || !act) throw httpError('Invalid module or action', 404);

  const key = body.key?.trim() || `${mod.key}.${act.key}`;
  return prisma.permission.create({
    data: { key, scope, moduleId, actionId },
    include: { module: true, action: true },
  });
}

export async function updatePermission(id, body) {
  const data = {};
  if (body.key != null) data.key = String(body.key).trim();
  if (body.scope != null) data.scope = body.scope === 'gym' ? 'gym' : 'platform';
  if (body.moduleId != null) data.moduleId = body.moduleId;
  if (body.actionId != null) data.actionId = body.actionId;
  return prisma.permission.update({
    where: { id },
    data,
    include: { module: true, action: true },
  });
}

export async function deletePermission(id) {
  await prisma.rolePermission.deleteMany({ where: { permissionId: id } });
  await prisma.permission.delete({ where: { id } });
  return { id };
}

export async function listRoles() {
  return prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { platformUsers: true, gymUsers: true } },
    },
    orderBy: [{ scope: 'asc' }, { key: 'asc' }],
  });
}

export async function createRole(body) {
  const key = String(body.key || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const scope = body.scope === 'gym' ? 'gym' : 'platform';
  if (!key || !name) throw httpError('key and name are required');

  const role = await prisma.role.create({ data: { key, name, scope } });
  const permissionIds = Array.isArray(body.permissionIds) ? body.permissionIds : [];
  if (permissionIds.length) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }
  return prisma.role.findUnique({
    where: { id: role.id },
    include: { rolePermissions: { include: { permission: true } } },
  });
}

export async function updateRole(id, body) {
  const data = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.key != null) data.key = String(body.key).trim().toLowerCase();
  if (body.scope != null) data.scope = body.scope === 'gym' ? 'gym' : 'platform';
  await prisma.role.update({ where: { id }, data });
  return prisma.role.findUnique({
    where: { id },
    include: { rolePermissions: { include: { permission: true } } },
  });
}

export async function updateRolePermissions(id, body) {
  const permissionIds = Array.isArray(body.permissionIds) ? body.permissionIds : [];
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  if (permissionIds.length) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: id,
        permissionId,
      })),
    });
  }
  return prisma.role.findUnique({
    where: { id },
    include: { rolePermissions: { include: { permission: true } } },
  });
}

export async function deleteRole(id) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: { select: { platformUsers: true, gymUsers: true } },
    },
  });
  if (!role) throw httpError('Role not found', 404);
  if (role._count.platformUsers || role._count.gymUsers) {
    throw httpError('Role is assigned to users', 409);
  }
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  await prisma.role.delete({ where: { id } });
  return { id };
}
