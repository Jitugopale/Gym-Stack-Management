import { useEffect, useState } from 'react';
import { Button, Input, PageHeader, Table } from '@/components/ui';
import FeatureToggles from '@/components/FeatureToggles';
import { featuresFromKeys, keysFromFeatures } from '@/config/gymFeatures';
import * as plansService from '@/services/admin/plansService';
import { showToast, toastApiError } from '@/utils/toast';

const empty = {
  key: '',
  name: '',
  durationMonths: 1,
  priceInr: 999,
  sortOrder: 0,
  isActive: true,
  defaultFeatureKeys: [],
};

export default function PlansPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = () =>
    plansService.listPlans(true).then((data) => setRows(Array.isArray(data) ? data : []));

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      key: row.key,
      name: row.name,
      durationMonths: row.durationMonths,
      priceInr: Number(row.priceInr),
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      defaultFeatureKeys: Array.isArray(row.defaultFeatureKeys)
        ? row.defaultFeatureKeys
        : [],
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        defaultFeatureKeys: form.defaultFeatureKeys,
      };
      if (editingId) {
        await plansService.updatePlan(editingId, payload);
        showToast('Plan updated.', 'success');
      } else {
        await plansService.createPlan(payload);
        showToast('Plan created.', 'success');
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
    if (!confirm('Delete this cloud plan?')) return;
    setActionId(id);
    try {
      await plansService.deletePlan(id);
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
        title="Subscription plans"
        action={<Button onClick={openCreate}>New plan</Button>}
      />

      {showForm ? (
        <form
          onSubmit={save}
          className="mb-6 grid gap-3 border border-[var(--border)] p-4 sm:grid-cols-2"
        >
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
          <Input
            label="Duration (months)"
            type="number"
            integer
            min="1"
            value={form.durationMonths}
            onChange={(e) =>
              setForm({ ...form, durationMonths: Number(e.target.value || 0) })
            }
            required
          />
          <Input
            label="Price (INR)"
            type="number"
            min="0"
            value={form.priceInr}
            onChange={(e) => setForm({ ...form, priceInr: Number(e.target.value || 0) })}
            required
          />
          <Input
            label="Sort order"
            type="number"
            integer
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value || 0) })}
          />
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <FeatureToggles
            label="Default modules for new gyms on this plan"
            value={featuresFromKeys(form.defaultFeatureKeys)}
            onChange={(features) =>
              setForm({
                ...form,
                defaultFeatureKeys: keysFromFeatures(features),
              })
            }
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
          { key: 'name', label: 'Name' },
          { key: 'key', label: 'Key' },
          {
            key: 'priceInr',
            label: 'Price',
            render: (row) => `₹${Number(row.priceInr).toLocaleString()}`,
          },
          { key: 'durationMonths', label: 'Months' },
          {
            key: 'modules',
            label: 'Default modules',
            render: (row) =>
              (row.defaultFeatureKeys || []).length
                ? row.defaultFeatureKeys.join(', ')
                : '—',
          },
          {
            key: 'isActive',
            label: 'Active',
            render: (row) => (row.isActive ? 'Yes' : 'No'),
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
        rows={rows}
      />
    </div>
  );
}
