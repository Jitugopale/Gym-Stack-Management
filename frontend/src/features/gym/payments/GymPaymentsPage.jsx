import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/axiosInstance';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, PageHeader, Select, Table } from '@/components/ui';
import { toastApiError } from '@/utils/toast';

export default function PaymentsPage() {
  const { hasPermission } = useAuth();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    memberId: '',
    amount: '',
    method: 'upi',
    note: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => members.find((m) => m.id === form.memberId),
    [members, form.memberId]
  );

  const load = async () => {
    const [pay, mem] = await Promise.all([
      api.get('/gym/payments'),
      api.get('/gym/members'),
    ]);
    setPayments(pay.data);
    setMembers(mem.data);
  };

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post('/gym/payments', form);
      setForm({ memberId: '', amount: '', method: 'upi', note: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      toastApiError(err, 'Could not record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        action={
          hasPermission('payments.create') ? (
            <Button onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Close' : 'Record payment'}
            </Button>
          ) : null
        }
      />

      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Ledger only — does not extend membership. Use <strong>Members → Renew</strong>{' '}
        to pay for the next plan period (monthly / quarterly / yearly days).
      </p>

      {showForm ? (
        <form
          onSubmit={create}
          className="mb-6 grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2"
        >
          <Select
            label="Member"
            value={form.memberId}
            onChange={(e) => {
              const memberId = e.target.value;
              const m = members.find((x) => x.id === memberId);
              setForm({
                ...form,
                memberId,
                amount:
                  m?.plan?.price != null ? String(Number(m.plan.price)) : form.amount,
              });
            }}
            required
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.plan
                  ? ` · ${m.plan.name} (${m.plan.durationDays}d)`
                  : ''}
              </option>
            ))}
          </Select>
          <Input
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Select
            label="Method"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            required
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </Select>
          <Input
            label="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          {selected?.plan ? (
            <p className="sm:col-span-2 text-sm text-[var(--text-muted)]">
              Plan price ₹{Number(selected.plan.price).toLocaleString()} for{' '}
              {selected.plan.durationDays} days. Recording here does not change end
              date.
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} loadingText="Saving…">
              Save payment
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        columns={[
          {
            key: 'member',
            label: 'Member',
            render: (row) => row.member?.name,
          },
          {
            key: 'plan',
            label: 'Plan',
            render: (row) => row.plan?.name || '—',
          },
          {
            key: 'amount',
            label: 'Amount',
            render: (row) => `₹${Number(row.amount).toLocaleString()}`,
          },
          { key: 'method', label: 'Method' },
          {
            key: 'note',
            label: 'Note',
            render: (row) => row.note || '—',
          },
          {
            key: 'paidAt',
            label: 'Paid',
            render: (row) => new Date(row.paidAt).toLocaleString(),
          },
        ]}
        rows={payments}
      />
    </div>
  );
}
