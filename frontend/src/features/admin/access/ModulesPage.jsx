import { useEffect, useState } from 'react';
import { Button, Input, PageHeader, Table } from '@/components/ui';
import * as accessService from '@/services/admin/accessService';
import { toastApiError } from '@/utils/toast';

export default function ModulesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ key: '', name: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = () =>
    accessService.listModules().then((data) => setRows(Array.isArray(data) ? data : []));

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editingId) await accessService.updateModule(editingId, form);
      else await accessService.createModule(form);
      setShowForm(false);
      setForm({ key: '', name: '' });
      setEditingId(null);
      await load();
    } catch (err) {
      toastApiError(err, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete module?')) return;
    setActionId(id);
    try {
      await accessService.deleteModule(id);
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
        title="Modules"
        action={
          <Button
            onClick={() => {
              setEditingId(null);
              setForm({ key: '', name: '' });
              setShowForm(true);
            }}
          >
            New module
          </Button>
        }
      />
      {showForm ? (
        <form onSubmit={save} className="mb-6 grid gap-3 border border-[var(--border)] p-4 sm:grid-cols-2">
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
          <div className="flex gap-2 sm:col-span-2">
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
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(row.id);
                    setForm({ key: row.key, name: row.name });
                    setShowForm(true);
                  }}
                >
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
        rows={rows}
      />
    </div>
  );
}
