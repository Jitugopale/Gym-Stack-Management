import api from '@/utils/axiosInstance';

export async function listUsers() {
  const { data } = await api.get('/admin/users');
  return Array.isArray(data) ? data : [];
}

export async function listPlatformRoles() {
  const { data } = await api.get('/admin/users/roles');
  return Array.isArray(data) ? data : [];
}

export async function createUser(payload) {
  const { data } = await api.post('/admin/users', payload);
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`/admin/users/${id}`, payload);
  return data;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
}

export async function setRequireEmailOtp(id, requireEmailOtp) {
  const { data } = await api.patch(`/admin/users/${id}/require-email-otp`, {
    requireEmailOtp,
  });
  return data;
}
