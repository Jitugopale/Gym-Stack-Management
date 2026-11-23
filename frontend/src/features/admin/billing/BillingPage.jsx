import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, PageHeader, Table } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosInstance';
import { showToast, toastApiError } from '@/utils/toast';

export default function BillingPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('billing.manage');
  const [invoices, setInvoices] = useState([]);
  const [advancing, setAdvancing] = useState(false);
  const [actionId, setActionId] = useState('');

  const load = async () => {
    const { data } = await api.get('/admin/invoices');
    setInvoices(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load().catch((err) => toastApiError(err, 'Failed to load invoices'));
  }, []);

  const markPaid = async (id) => {
    if (!canManage) {
      showToast('You do not have permission for this action', 'error');
      return;
    }
    setActionId(id);
    try {
      await api.post(`/admin/invoices/${id}/pay`);
      showToast('Invoice marked paid — gym unlocked', 'success');
      await load();
    } catch (err) {
      toastApiError(err, 'Pay failed');
    } finally {
      setActionId('');
    }
  };

  const advance = async () => {
    if (!canManage) {
      showToast('You do not have permission for this action', 'error');
      return;
    }
    if (advancing) return;
    setAdvancing(true);
    try {
      const { data } = await api.post('/admin/billing/advance');
      showToast(`Billing advance: ${data.changed} status change(s)`, 'success');
      await load();
    } catch (err) {
      toastApiError(err, 'Advance failed');
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cloud billing"
        action={
          canManage ? (
            <Button onClick={advance} loading={advancing} loadingText="Running…">
              Run billing advance
            </Button>
          ) : null
        }
      />

      <p className="mb-4 text-sm text-[var(--muted-foreground)]">
        Manage subscription catalog on{' '}
        <Link className="underline" to={ROUTES.PLANS}>
          Plans
        </Link>
        .
      </p>

      <h3 className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">
        Invoices
      </h3>
      <Table
        columns={[
          { key: 'invoiceRef', label: 'Ref' },
          {
            key: 'gym',
            label: 'Gym',
            render: (row) => row.gym?.name,
          },
          {
            key: 'amount',
            label: 'Amount',
            render: (row) => `₹${Number(row.amount).toLocaleString()}`,
          },
          { key: 'status', label: 'Status' },
          {
            key: 'actions',
            label: '',
            render: (row) =>
              canManage && row.status !== 'paid' ? (
                <Button
                  onClick={() => markPaid(row.id)}
                  loading={actionId === row.id}
                  loadingText="Paying…"
                >
                  Mark paid
                </Button>
              ) : null,
          },
        ]}
        rows={invoices}
      />
    </div>
  );
}
