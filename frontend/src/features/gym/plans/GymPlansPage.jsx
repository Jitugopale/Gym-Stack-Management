import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, PageHeader, Table } from '@/components/ui';
import { toastApiError } from '@/utils/toast';

export default function PlansPage() {
  const { hasPermission } = useAuth();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: '', durationDays: 30, price: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = () => api.get('/gym/plans').then((res) => setPlans(res.data));

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post('/gym/plans', form);
      setForm({ name: '', durationDays: 30, price: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      toastApiError(err, 'Could not create plan');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete plan?')) return;
    setActionId(id);
    try {
      await api.delete(`/gym/plans/${id}`);
      await load();
    } finally {
      setActionId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Membership plans"
        action={
          hasPermission('plans.create') ? (
            <Button onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Close' : 'Add plan'}
            </Button>
          ) : null
        }
      />

      {showForm ? (
        <form onSubmit={create} className="mb-6 grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Duration (days) — 30 monthly / 90 quarterly / 365 yearly"
            type="number"
            integer
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            required
          />
          <Input
            label="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <div className="sm:col-span-3">
            <Button type="submit" loading={saving} loadingText="Saving…">
              Save plan
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'durationDays', label: 'Days' },
          {
            key: 'price',
            label: 'Price',
            render: (row) => `₹${Number(row.price).toLocaleString()}`,
          },
          {
            key: 'isActive',
            label: 'Active',
            render: (row) => (row.isActive ? 'Yes' : 'No'),
          },
          {
            key: 'actions',
            label: '',
            render: (row) =>
              hasPermission('plans.delete') ? (
                <Button
                  variant="danger"
                  loading={actionId === row.id}
                  loadingText="Deleting…"
                  onClick={() => remove(row.id)}
                >
                  Delete
                </Button>
              ) : null,
          },
        ]}
        rows={plans}
      />
    </div>
  );
}
