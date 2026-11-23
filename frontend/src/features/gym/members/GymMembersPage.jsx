import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/axiosInstance';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, PageHeader, Select, Table } from '@/components/ui';
import { showToast, toastApiError } from '@/utils/toast';

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toISOString().slice(0, 10);
}

function addDaysIso(iso, days) {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function hasFutureEnd(row) {
  if (!row?.endDate) return false;
  return fmtDate(row.endDate) > todayIso();
}

function planLabel(p) {
  if (!p) return '—';
  const days = Number(p.durationDays);
  const hint =
    days >= 360 ? 'yearly' : days >= 85 ? 'quarterly' : days >= 28 ? 'monthly' : `${days}d`;
  return `${p.name} · ${days}d (${hint}) · ₹${Number(p.price).toLocaleString()}`;
}

function resolveRestartStart(row, mode, customDate) {
  if (mode === 'custom') return customDate || '';
  if (mode === 'from_expiry' && row.endDate) {
    return addDaysIso(fmtDate(row.endDate), 1);
  }
  return todayIso();
}

const emptyCreate = () => ({
  name: '',
  email: '',
  phone: '',
  planId: '',
  startDate: todayIso(),
  method: 'upi',
});

export default function MembersPage() {
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState('');
  const [expiringIn, setExpiringIn] = useState('');
  const [form, setForm] = useState(emptyCreate);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [restart, setRestart] = useState(null);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === form.planId),
    [plans, form.planId]
  );

  const restartPlan = useMemo(() => {
    if (!restart) return null;
    return (
      plans.find((p) => p.id === restart.planId) ||
      restart.row.plan ||
      null
    );
  }, [restart, plans]);

  const restartPreviewStart = useMemo(() => {
    if (!restart) return '';
    return resolveRestartStart(restart.row, restart.mode, restart.customDate);
  }, [restart]);

  const restartPreviewEnd = useMemo(() => {
    if (!restartPlan || !restartPreviewStart) return '';
    return addDaysIso(restartPreviewStart, restartPlan.durationDays);
  }, [restartPlan, restartPreviewStart]);

  const load = async () => {
    const params = {};
    if (status) params.status = status;
    if (expiringIn) params.expiringIn = expiringIn;
    const m = await api.get('/gym/members', { params });
    setMembers(Array.isArray(m.data) ? m.data : []);
    try {
      const p = await api.get('/gym/plans');
      setPlans(Array.isArray(p.data) ? p.data : []);
    } catch {
      setPlans([]);
    }
  };

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, [status, expiringIn]);

  const create = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.planId) {
      showToast('Pick a plan — end date follows plan days.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/gym/members', {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        planId: form.planId,
        startDate: form.startDate,
        method: form.method,
      });
      setForm(emptyCreate());
      setShowForm(false);
      showToast('Member added for full plan period.', 'success');
      await load();
    } catch (err) {
      toastApiError(err, 'Could not create member');
    } finally {
      setSaving(false);
    }
  };

  /** Advance renew only when endDate is still in the future. */
  const renewAdvance = async (row) => {
    if (!hasPermission('members.update')) return;
    if (!hasFutureEnd(row)) {
      openRestart(row);
      return;
    }
    if (!row.planId && !row.plan) {
      showToast('Assign a plan before renewing.', 'error');
      openRestart(row);
      return;
    }
    const nextStart = addDaysIso(fmtDate(row.endDate), 1);
    const days = row.plan?.durationDays;
    if (
      !confirm(
        `Advance renew ${row.name}?\nStarts ${nextStart} for ${days || '?'} days (${row.plan?.name || 'plan'}) · ₹${Number(
          row.plan?.price || 0
        ).toLocaleString()}`
      )
    ) {
      return;
    }
    setActionId(`renew-${row.id}`);
    try {
      await api.post(`/gym/members/${row.id}/renew`, { method: 'upi' });
      showToast('Renewed from day after current end.', 'success');
      await load();
    } catch (err) {
      toastApiError(err, 'Renew failed');
    } finally {
      setActionId('');
    }
  };

  const openRestart = (row) => {
    setShowForm(false);
    setRestart({
      row,
      mode: 'today',
      customDate: todayIso(),
      method: 'upi',
      planId: row.planId || '',
    });
  };

  const submitRestart = async (e) => {
    e.preventDefault();
    if (!restart || saving) return;

    const planId = restart.planId || restart.row.planId;
    if (!planId) {
      showToast('Select a membership plan.', 'error');
      return;
    }
    if (restart.mode === 'from_expiry' && !restart.row.endDate) {
      showToast('No previous end date to continue from.', 'error');
      return;
    }

    const startDate = resolveRestartStart(
      restart.row,
      restart.mode,
      restart.customDate
    );
    if (!startDate) {
      showToast('Choose a start date.', 'error');
      return;
    }

    setSaving(true);
    setActionId(`renew-${restart.row.id}`);
    try {
      await api.post(`/gym/members/${restart.row.id}/renew`, {
        startDate,
        startMode: restart.mode,
        planId,
        method: restart.method,
      });
      showToast(`Restarted from ${startDate}.`, 'success');
      setRestart(null);
      await load();
    } catch (err) {
      toastApiError(err, 'Restart failed');
    } finally {
      setSaving(false);
      setActionId('');
    }
  };

  const changeMemberStatus = async (row, nextStatus) => {
    if (!hasPermission('members.update')) return;
    const messages = {
      frozen: `Freeze ${row.name}? Access pauses; end date stays the same.`,
      cancelled: `Cancel ${row.name}? End date becomes today — membership stops.`,
      active: `Unfreeze ${row.name}? Access resumes.`,
    };
    if (!confirm(messages[nextStatus] || `Set status to ${nextStatus}?`)) return;
    setActionId(`status-${row.id}`);
    try {
      await api.patch(`/gym/members/${row.id}`, { status: nextStatus });
      showToast(
        nextStatus === 'frozen'
          ? 'Membership frozen.'
          : nextStatus === 'cancelled'
            ? 'Membership cancelled.'
            : 'Membership updated.',
        'success'
      );
      await load();
    } catch (err) {
      toastApiError(err, 'Status update failed');
    } finally {
      setActionId('');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete member? This permanently removes their record.')) return;
    setActionId(id);
    try {
      await api.delete(`/gym/members/${id}`);
      await load();
    } finally {
      setActionId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Members"
        action={
          hasPermission('members.create') ? (
            <Button
              onClick={() => {
                setRestart(null);
                setShowForm((v) => !v);
              }}
            >
              {showForm ? 'Close' : 'Add member'}
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select
          label="Expiring in"
          value={expiringIn}
          onChange={(e) => setExpiringIn(e.target.value)}
        >
          <option value="">—</option>
          <option value="7">7 days</option>
          <option value="15">15 days</option>
          <option value="30">30 days</option>
        </Select>
      </div>

      {showForm ? (
        <form
          onSubmit={create}
          className="mb-6 grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2"
        >
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Select
            label="Plan"
            value={form.planId}
            onChange={(e) => setForm({ ...form, planId: e.target.value })}
            required
          >
            <option value="">Select plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {planLabel(p)}
              </option>
            ))}
          </Select>
          <Input
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
          <Select
            label="Pay method"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </Select>
          {selectedPlan ? (
            <p className="sm:col-span-2 text-sm text-[var(--text-muted)]">
              Pays ₹{Number(selectedPlan.price).toLocaleString()} once for{' '}
              {selectedPlan.durationDays} days (end{' '}
              {addDaysIso(form.startDate, selectedPlan.durationDays)}).
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} loadingText="Saving…">
              Save member
            </Button>
          </div>
        </form>
      ) : null}

      {restart ? (
        <form
          onSubmit={submitRestart}
          className="mb-6 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-2"
        >
          <p className="sm:col-span-2 text-sm font-medium">
            Restart {restart.row.name}
            {restart.row.endDate
              ? ` · previous end ${fmtDate(restart.row.endDate)}`
              : ''}
          </p>
          <Select
            label="Start from"
            value={restart.mode}
            onChange={(e) => setRestart({ ...restart, mode: e.target.value })}
            required
          >
            <option value="today">Today (fresh start)</option>
            <option value="from_expiry" disabled={!restart.row.endDate}>
              From expiry (day after previous end)
            </option>
            <option value="custom">Pick date…</option>
          </Select>
          {restart.mode === 'custom' ? (
            <Input
              label="Start date"
              type="date"
              value={restart.customDate}
              onChange={(e) =>
                setRestart({ ...restart, customDate: e.target.value })
              }
              required
            />
          ) : (
            <Input
              label="Resolved start"
              type="date"
              value={restartPreviewStart}
              readOnly
            />
          )}
          <Select
            label="Plan"
            value={restart.planId}
            onChange={(e) => setRestart({ ...restart, planId: e.target.value })}
            required={!restart.row.planId}
          >
            {restart.row.planId ? (
              <option value={restart.row.planId}>
                Current · {planLabel(restart.row.plan)}
              </option>
            ) : (
              <option value="">Select plan</option>
            )}
            {plans
              .filter((p) => p.id !== restart.row.planId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {planLabel(p)}
                </option>
              ))}
          </Select>
          <Select
            label="Pay method"
            value={restart.method}
            onChange={(e) => setRestart({ ...restart, method: e.target.value })}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </Select>
          <p className="sm:col-span-2 text-sm text-[var(--text-muted)]">
            Period {restartPreviewStart || '—'} → {restartPreviewEnd || '—'} · ₹
            {Number(restartPlan?.price || 0).toLocaleString()}
          </p>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" loading={saving} loadingText="Restarting…">
              Confirm restart
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => setRestart(null)}
            >
              Close
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        columns={[
          { key: 'name', label: 'Name' },
          {
            key: 'plan',
            label: 'Plan',
            render: (row) =>
              row.plan
                ? `${row.plan.name} (${row.plan.durationDays}d)`
                : '—',
          },
          {
            key: 'period',
            label: 'Period',
            render: (row) => `${fmtDate(row.startDate)} → ${fmtDate(row.endDate)}`,
          },
          { key: 'status', label: 'Status' },
          {
            key: 'actions',
            label: '',
            render: (row) => {
              const canUpdate = hasPermission('members.update');
              const future = hasFutureEnd(row);
              const showAdvance =
                canUpdate &&
                (row.status === 'active' || row.status === 'frozen') &&
                future;
              const showRestart =
                canUpdate &&
                (row.status === 'expired' ||
                  row.status === 'cancelled' ||
                  ((row.status === 'active' || row.status === 'frozen') &&
                    !future));

              return (
                <div className="flex flex-wrap gap-2">
                  {showAdvance ? (
                    <Button
                      variant="ghost"
                      loading={actionId === `renew-${row.id}`}
                      loadingText="Renewing…"
                      onClick={() => renewAdvance(row)}
                    >
                      Renew
                    </Button>
                  ) : null}
                  {showRestart ? (
                    <Button
                      variant="ghost"
                      loading={actionId === `renew-${row.id}`}
                      loadingText="…"
                      onClick={() => openRestart(row)}
                    >
                      Restart
                    </Button>
                  ) : null}
                  {canUpdate && row.status === 'active' ? (
                    <Button
                      variant="ghost"
                      loading={actionId === `status-${row.id}`}
                      loadingText="…"
                      onClick={() => changeMemberStatus(row, 'frozen')}
                    >
                      Freeze
                    </Button>
                  ) : null}
                  {canUpdate && row.status === 'frozen' ? (
                    <Button
                      variant="ghost"
                      loading={actionId === `status-${row.id}`}
                      loadingText="…"
                      onClick={() => changeMemberStatus(row, 'active')}
                    >
                      Unfreeze
                    </Button>
                  ) : null}
                  {canUpdate &&
                  (row.status === 'active' || row.status === 'frozen') ? (
                    <Button
                      variant="ghost"
                      loading={actionId === `status-${row.id}`}
                      loadingText="…"
                      onClick={() => changeMemberStatus(row, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  {hasPermission('members.delete') ? (
                    <Button
                      variant="danger"
                      loading={actionId === row.id}
                      loadingText="Deleting…"
                      onClick={() => remove(row.id)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              );
            },
          },
        ]}
        rows={members}
      />
    </div>
  );
}
