import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, PageHeader, Table } from '@/components/ui';
import { showToast, toastApiError } from '@/utils/toast';

export default function StaffPage() {
  const { hasPermission } = useAuth();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = () =>
    api.get('/gym/staff').then((res) => setStaff(Array.isArray(res.data) ? res.data : []));

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load'));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await api.post('/gym/staff', form);
      setForm({ name: '', email: '' });
      setShowForm(false);
      if (data.invite?.emailed) {
        showToast(`Staff created. Login emailed to ${data.email}.`, 'success');
      } else if (data.invite?.temporaryPassword) {
        showToast(
          `Staff created. Temp password for ${data.email}: ${data.invite.temporaryPassword}`,
          'success'
        );
      }
      await load();
    } catch (err) {
      toastApiError(err, 'Could not create staff');
    } finally {
      setSaving(false);
    }
  };

  const toggle2fa = async (row) => {
    if (row.role === 'gym_staff') return;
    setActionId(`2fa-${row.id}`);
    try {
      await api.patch(`/gym/staff/${row.id}/require-email-otp`, {
        requireEmailOtp: !row.requireEmailOtp,
      });
      await load();
    } catch (err) {
      toastApiError(err, '2FA update failed');
    } finally {
      setActionId('');
    }
  };

  const remove = async (id, role) => {
    if (role === 'gym_owner') return;
    if (!confirm('Remove this staff user from the gym?')) return;
    setActionId(id);
    try {
      await api.delete(`/gym/staff/${id}`);
      await load();
    } finally {
      setActionId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Staff"
        action={
          hasPermission('staff.manage') ? (
            <Button onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Close' : 'Add staff'}
            </Button>
          ) : null
        }
      />

      {showForm ? (
        <form
          onSubmit={create}
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
          />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} loadingText="Creating…">
              Create & email credentials
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          {
            key: 'requireEmailOtp',
            label: '2FA',
            render: (row) =>
              row.role === 'gym_owner' && hasPermission('staff.manage') ? (
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
              hasPermission('staff.manage') && row.role !== 'gym_owner' ? (
                <Button
                  variant="danger"
                  loading={actionId === row.id}
                  loadingText="Removing…"
                  onClick={() => remove(row.id, row.role)}
                >
                  Remove
                </Button>
              ) : null,
          },
        ]}
        rows={staff}
      />
    </div>
  );
}