import { useEffect, useState } from 'react';
import { Button, Input, PageHeader, Select, Table } from '@/components/ui';
import FeatureToggles from '@/components/FeatureToggles';
import { featuresFromKeys } from '@/config/gymFeatures';
import * as gymsService from '@/services/admin/gymsService';
import * as plansService from '@/services/admin/plansService';
import { showToast, toastApiError } from '@/utils/toast';

const emptyCreate = {
  name: '',
  slug: '',
  ownerName: '',
  ownerEmail: '',
  requireOwner2fa: false,
  planKey: 'core_monthly',
  features: [],
};

export default function GymsPage() {
  const [gyms, setGyms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = async () => {
    const [g, p] = await Promise.all([
      gymsService.listGyms(),
      plansService.listPlans(true),
    ]);
    setGyms(g);
    setPlans(p);
  };

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const applyPlanDefaults = (planKey, plansList = plans) => {
    const plan = plansList.find((p) => p.key === planKey);
    return featuresFromKeys(plan?.defaultFeatureKeys || []);
  };

  const openCreate = () => {
    const planKey = emptyCreate.planKey;
    setForm({
      ...emptyCreate,
      planKey,
      features: applyPlanDefaults(planKey),
    });
    setShowForm((v) => !v);
  };

  const create = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const data = await gymsService.createGym({
        ...form,
        slug: form.slug || undefined,
        features: form.features,
      });
      setForm(emptyCreate);
      setShowForm(false);
      if (data.invite?.emailed) {
        showToast(`Gym created. Login emailed to ${data.owner.email}.`, 'success');
      } else if (data.invite?.temporaryPassword) {
        showToast(
          `Gym created. Temp password for ${data.owner.email}: ${data.invite.temporaryPassword}`,
          'success'
        );
      } else {
        showToast('Gym created.', 'success');
      }
      await load();
    } catch (err) {
      toastApiError(err, 'Could not create gym');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (row) => {
    try {
      const feat = await gymsService.getGymFeatures(row.id);
      setEditForm({
        id: row.id,
        name: row.name,
        slug: row.slug,
        requireOwner2fa: row.requireOwner2fa,
        planKey: row.subscriptionPlan?.key || '',
        status: row.status,
        features: feat.features.map((f) => ({
          featureKey: f.featureKey,
          isEnabled: f.isEnabled,
        })),
      });
      setShowForm(false);
    } catch (err) {
      toastApiError(err, 'Could not load features');
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editForm || saving) return;
    setSaving(true);
    try {
      await gymsService.updateGym(editForm.id, {
        name: editForm.name,
        slug: editForm.slug,
        requireOwner2fa: editForm.requireOwner2fa,
        planKey: editForm.planKey || undefined,
        status: editForm.status,
        features: editForm.features,
      });
      setEditForm(null);
      showToast('Gym updated.', 'success');
      await load();
    } catch (err) {
      toastApiError(err, 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this gym and all tenant data?')) return;
    setActionId(id);
    try {
      await gymsService.deleteGym(id);
      await load();
    } finally {
      setActionId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Gyms"
        action={
          <Button onClick={openCreate}>{showForm ? 'Close' : 'New gym'}</Button>
        }
      />

      {showForm ? (
        <form
          onSubmit={create}
          className="mb-6 grid gap-3 border border-[var(--border)] p-4 sm:grid-cols-2"
        >
          <Input
            label="Gym name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="auto-from-name"
          />
          <Input
            label="Owner name"
            value={form.ownerName}
            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            required
          />
          <Input
            label="Owner email"
            type="email"
            value={form.ownerEmail}
            onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
            required
          />
          <Select
            label="Cloud plan"
            value={form.planKey}
            onChange={(e) => {
              const planKey = e.target.value;
              setForm({
                ...form,
                planKey,
                features: applyPlanDefaults(planKey),
              });
            }}
            required
          >
            {plans.map((p) => (
              <option key={p.id} value={p.key}>
                {p.name} · ₹{Number(p.priceInr)}
              </option>
            ))}
          </Select>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.requireOwner2fa}
              onChange={(e) =>
                setForm({ ...form, requireOwner2fa: e.target.checked })
              }
            />
            Require owner 2FA
          </label>
          <FeatureToggles
            label="Modules (from plan — SA can change)"
            value={form.features}
            onChange={(features) => setForm({ ...form, features })}
          />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} loadingText="Creating…">
              Create & email credentials
            </Button>
          </div>
        </form>
      ) : null}

      {editForm ? (
        <form
          onSubmit={saveEdit}
          className="mb-6 grid gap-3 border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-2"
        >
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Slug"
            value={editForm.slug}
            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
            required
          />
          <Select
            label="Cloud plan"
            value={editForm.planKey}
            onChange={(e) =>
              setEditForm({ ...editForm, planKey: e.target.value })
            }
            required
          >
            {plans.map((p) => (
              <option key={p.id} value={p.key}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            required
          >
            <option value="active">active</option>
            <option value="grace">grace</option>
            <option value="soft_lock">soft_lock</option>
            <option value="login_blocked">login_blocked</option>
          </Select>
          <label className="flex items-end gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={editForm.requireOwner2fa}
              onChange={(e) =>
                setEditForm({ ...editForm, requireOwner2fa: e.target.checked })
              }
            />
            Require owner 2FA
          </label>
          <FeatureToggles
            label="Modules (SA override)"
            value={editForm.features}
            onChange={(features) => setEditForm({ ...editForm, features })}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" loading={saving} loadingText="Saving…">
              Save gym
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => setEditForm(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
          {
            key: 'plan',
            label: 'Plan',
            render: (row) => row.subscriptionPlan?.name || '—',
          },
          { key: 'status', label: 'Status' },
          {
            key: 'modules',
            label: 'Modules on',
            render: (row) => {
              const on = (row.featureToggles || []).filter((t) => t.isEnabled);
              return on.length ? on.map((t) => t.featureKey).join(', ') : '—';
            },
          },
          {
            key: 'requireOwner2fa',
            label: 'Owner 2FA',
            render: (row) => (row.requireOwner2fa ? 'On' : 'Off'),
          },
          {
            key: 'members',
            label: 'Members',
            render: (row) => row._count?.members ?? 0,
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
        rows={gyms}
      />
    </div>
  );
}
