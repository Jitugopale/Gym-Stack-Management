import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';
import { PageHeader, Stat } from '@/components/ui';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div>
      <PageHeader title="Platform dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gyms" value={stats?.gyms ?? '—'} />
        <Stat label="Members" value={stats?.members ?? '—'} />
        <Stat label="Payments" value={stats?.payments ?? '—'} />
        <Stat label="Revenue" value={stats ? `₹${Number(stats.revenue).toLocaleString()}` : '—'} />
      </div>
    </div>
  );
}
