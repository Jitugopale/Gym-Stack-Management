import { useEffect, useState } from 'react';
import { PageHeader, Table } from '@/components/ui';
import api from '@/utils/axiosInstance';

export default function GymBillingPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/gym/billing').then((res) => setData(res.data));
  }, []);

  return (
    <div>
      <PageHeader title="Cloud billing" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase text-[var(--muted-foreground)]">Status</p>
          <p className="mt-1 text-xl font-semibold text-[var(--primary)]">
            {data?.status || '—'}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase text-[var(--muted-foreground)]">Plan</p>
          <p className="mt-1 text-xl font-semibold">
            {data?.plan?.name || '—'}
          </p>
        </div>
      </div>
      <Table
        columns={[
          { key: 'invoiceRef', label: 'Ref' },
          {
            key: 'amount',
            label: 'Amount',
            render: (row) => `₹${Number(row.amount).toLocaleString()}`,
          },
          { key: 'status', label: 'Status' },
          {
            key: 'dueDate',
            label: 'Due',
            render: (row) => new Date(row.dueDate).toLocaleDateString(),
          },
        ]}
        rows={data?.invoices || []}
      />
    </div>
  );
}
