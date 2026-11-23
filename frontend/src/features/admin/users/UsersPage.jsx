import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, PageHeader, Select, Table } from '@/components/ui';
import * as usersService from '@/services/admin/usersService';
import { showToast, toastApiError } from '@/utils/toast';

const empty = {
  name: '',
  email: '',
  roleKey: 'super_admin_staff',
  requireEmailOtp: false,
};

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('users.manage');
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = async () => {
    const [users, roleRows] = await Promise.all([
      usersService.listUsers(),
      usersService.listPlatformRoles(),
    ]);
    setRows(users);
    setRoles(roleRows.filter((r) => r.key !== 'super_admin'));
  };

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (row) => {
    if (row.locked || row.role === 'super_admin') {
      showToast('Super Admin cannot be edited here', 'error');
      return;
    }
    setEditingId(row.id);
    setForm({
      name: row.name,
      email: row.email,
      roleKey: row.role,
      requireEmailOtp: row.requireEmailOtp,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editingId) {
        await usersService.updateUser(editingId, {
          name: form.name,
          roleKey: form.roleKey,
          requireEmailOtp: form.requireEmailOtp,
        });
        showToast('Staff updated.', 'success');
      } else {
        const data = await usersService.createUser({
          name: form.name,
          email: form.email,
          roleKey: form.roleKey,
          requireEmailOtp: form.requireEmailOtp,
        });
        if (data.invite?.emailed) {
          showToast(`Staff created. Login emailed to ${data.email}.`, 'success');
        } else if (data.invite?.temporaryPassword) {
          showToast(
            `Staff created. Temp password for ${data.email}: ${data.invite.temporaryPassword}`,
            'success'
          );
        } else {
          showToast('Staff created.', 'success');
        }
      }
      setShowForm(false);
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      toastApiError(err, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggle2fa = async (row) => {
    setActionId(`2fa-${row.id}`);
    try {
      await usersService.setRequireEmailOtp(row.id, !row.requireEmailOtp);
      await load();
    } catch (err) {
      toastApiError(err, 'Update failed');
    } finally {
      setActionId('');
    }
  };

  const remove = async (row) => {
    if (row.locked || row.role === 'super_admin') return;
    if (!confirm(`Remove platform staff ${row.email}?`)) return;
    setActionId(row.id);
    try {
      await usersService.deleteUser(row.id);
      showToast('Staff removed.', 'success');
      await load();
    } catch (err) {
      toastApiError(err, 'Delete failed');
    } finally {
      setActionId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Platform users"
        action={
          canManage ? (
            <Button
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                  setEditingId(null);
                } else openCreate();
              }}
            >
              {showForm ? 'Close' : 'Add staff'}
            </Button>
          ) : null
        }
      />

      {showForm && canManage ? (
        <form
          onSubmit={save}
          className="mb-6 grid gap-3 border border-[var(--border)] p-4 sm:grid-cols-2"
        >
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={Boolean(editingId)}
          />
          <Select
            label="Role"
            value={form.roleKey}
            onChange={(e) => setForm({ ...form, roleKey: e.target.value })}
            required
          >
            {roles.map((role) => (
              <option key={role.id} value={role.key}>
                {role.name}
              </option>
            ))}
          </Select>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.requireEmailOtp}
              onChange={(e) =>
                setForm({ ...form, requireEmailOtp: e.target.checked })
              }
            />
            Require email 2FA
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              type="submit"
              loading={saving}
              loadingText={editingId ? 'Updating…' : 'Creating…'}
            >
              {editingId ? 'Update staff' : 'Create & email credentials'}
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          {
            key: 'role',
            label: 'Role',
            render: (row) => row.roleName || row.role,
          },
          {
            key: 'requireEmailOtp',
            label: '2FA',
            render: (row) =>
              canManage ? (
                <Button
                  variant="ghost"
                  loading={actionId === `2fa-${row.id}`}
                  onClick={() => toggle2fa(row)}
                >
                  {row.requireEmailOtp ? 'On' : 'Off'}
                </Button>
              ) : (
                <span>{row.requireEmailOtp ? 'On' : 'Off'}</span>
              ),
          },
          {
            key: 'actions',
            label: '',
            render: (row) =>
              canManage && !row.locked && row.role !== 'super_admin' ? (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    loading={actionId === row.id}
                    loadingText="Removing…"
                    onClick={() => remove(row)}
                  >
                    Remove
                  </Button>
                </div>
              ) : row.locked || row.role === 'super_admin' ? (
                <span className="text-xs text-[var(--muted-foreground)]">Locked</span>
              ) : null,
          },
        ]}
        rows={rows}
      />
    </div>
  );
}
