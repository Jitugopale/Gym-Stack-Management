import { useEffect, useState } from 'react';
import { Button, Input, PageHeader, Select, Table } from '@/components/ui';
import * as accessService from '@/services/admin/accessService';
import { toastApiError } from '@/utils/toast';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({
    key: '',
    name: '',
    scope: 'platform',
    permissionIds: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = async () => {
    const [roleRows, catalog] = await Promise.all([
      accessService.listRoles(),
      accessService.listPermissionsCatalog(),
    ]);
    setRoles(roleRows);
    setPermissions(catalog.permissions || []);
  };

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ key: '', name: '', scope: 'platform', permissionIds: [] });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      key: row.key,
      name: row.name,
      scope: row.scope,
      permissionIds: row.rolePermissions?.map((rp) => rp.permissionId) || [],
    });
    setShowForm(true);
  };

  const togglePerm = (id) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((x) => x !== id)
        : [...prev.permissionIds, id],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editingId) {
        await accessService.updateRole(editingId, {
          name: form.name,
          key: form.key,
          scope: form.scope,
        });
        await accessService.updateRolePermissions(editingId, form.permissionIds);
      } else {
        await accessService.createRole(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toastApiError(err, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete role?')) return;
    setActionId(id);
    try {
      await accessService.deleteRole(id);
      await load();
    } catch (err) {
      toastApiError(err, 'Delete failed');
    } finally {
      setActionId('');
    }
  };

  const scopedPerms = permissions.filter((p) => p.scope === form.scope);

  return (
    <div>
      <PageHeader
        title="Roles"
        action={<Button onClick={openCreate}>New role</Button>}
      />

      {showForm ? (
        <form onSubmit={save} className="mb-6 space-y-4 border border-[var(--border)] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              required
              disabled={Boolean(editingId)}
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Select
              label="Scope"
              value={form.scope}
              onChange={(e) =>
                setForm({ ...form, scope: e.target.value, permissionIds: [] })
              }
              required
            >
              <option value="platform">platform</option>
              <option value="gym">gym</option>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Permissions ({form.scope})</p>
            <div className="grid max-h-56 gap-2 overflow-y-auto border border-[var(--border)] p-3 sm:grid-cols-2">
              {scopedPerms.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.permissionIds.includes(p.id)}
                    onChange={() => togglePerm(p.id)}
                  />
                  <span>{p.key}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              loading={saving}
              loadingText={editingId ? 'Updating…' : 'Creating…'}
            >
              {editingId ? 'Update' : 'Create'}
            </Button>
            <Button variant="ghost" disabled={saving} onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        columns={[
          { key: 'key', label: 'Key' },
          { key: 'name', label: 'Name' },
          { key: 'scope', label: 'Scope' },
          {
            key: 'perms',
            label: 'Perms',
            render: (row) => row.rolePermissions?.length || 0,
          },
          {
            key: 'users',
            label: 'Users',
            render: (row) =>
              (row._count?.platformUsers || 0) + (row._count?.gymUsers || 0),
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  loading={actionId === row.id}
                  loadingText="Deleting…"
                  onClick={() => remove(row.id)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        rows={roles}
      />
    </div>
  );
}
