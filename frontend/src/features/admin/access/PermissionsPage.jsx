import { useEffect, useState } from 'react';
import { Button, Input, PageHeader, Select, Table } from '@/components/ui';
import * as accessService from '@/services/admin/accessService';
import { toastApiError } from '@/utils/toast';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState({
    key: '',
    moduleId: '',
    actionId: '',
    scope: 'platform',
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = async () => {
    const data = await accessService.listPermissionsCatalog();
    setPermissions(data.permissions || []);
    setModules(data.modules || []);
    setActions(data.actions || []);
  };

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await accessService.createPermission({
        ...form,
        key: form.key || undefined,
      });
      setShowForm(false);
      setForm({ key: '', moduleId: '', actionId: '', scope: 'platform' });
      await load();
    } catch (err) {
      toastApiError(err, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete permission?')) return;
    setActionId(id);
    try {
      await accessService.deletePermission(id);
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
        title="Permissions"
        action={<Button onClick={() => setShowForm(true)}>New permission</Button>}
      />

      {showForm ? (
        <form
          onSubmit={save}
          className="mb-6 grid gap-3 border border-[var(--border)] p-4 sm:grid-cols-2"
        >
          <Select
            label="Module"
            value={form.moduleId}
            onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
            required
          >
            <option value="">Select…</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.key}
              </option>
            ))}
          </Select>
          <Select
            label="Action"
            value={form.actionId}
            onChange={(e) => setForm({ ...form, actionId: e.target.value })}
            required
          >
            <option value="">Select…</option>
            {actions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.key}
              </option>
            ))}
          </Select>
          <Select
            label="Scope"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            required
          >
            <option value="platform">platform</option>
            <option value="gym">gym</option>
          </Select>
          <Input
            label="Key override (optional)"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="auto: module.action"
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" loading={saving} loadingText="Creating…">
              Create
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
          { key: 'scope', label: 'Scope' },
          {
            key: 'module',
            label: 'Module',
            render: (row) => row.module?.key,
          },
          {
            key: 'action',
            label: 'Action',
            render: (row) => row.action?.key,
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <Button
                variant="danger"
                loading={actionId === row.id}
                loadingText="Deleting…"
                onClick={() => remove(row.id)}
              >
                Delete
              </Button>
            ),
          },
        ]}
        rows={permissions}
      />
    </div>
  );
}
