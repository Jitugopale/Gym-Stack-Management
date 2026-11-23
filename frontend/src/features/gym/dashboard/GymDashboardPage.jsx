import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';
import { PageHeader, Stat, Table } from '@/components/ui';

export default function GymDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/gym/dashboard').then((res) => setStats(res.data));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Members" value={stats?.members ?? '—'} />
        <Stat label="Active plans" value={stats?.activePlans ?? '—'} />
        <Stat label="Payments" value={stats?.payments ?? '—'} />
        <Stat
          label="Revenue"
          value={stats ? `₹${Number(stats.revenue).toLocaleString()}` : '—'}
        />
      </div>
      <h3 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">Recent payments</h3>
      <Table
        columns={[
          {
            key: 'member',
            label: 'Member',
            render: (row) => row.member?.name,
          },
          {
            key: 'amount',
            label: 'Amount',
            render: (row) => `₹${Number(row.amount).toLocaleString()}`,
          },
          {
            key: 'paidAt',
            label: 'Paid',
            render: (row) => new Date(row.paidAt).toLocaleDateString(),
          },
        ]}
        rows={stats?.recentPayments || []}
      />
    </div>
  );
}
