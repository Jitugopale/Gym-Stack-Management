import api from '@/utils/axiosInstance';

export const listPlans = (all = true) =>
  api.get('/admin/plans', { params: all ? { all: 1 } : {} }).then((r) => r.data);

export const createPlan = (body) =>
  api.post('/admin/plans', body).then((r) => r.data);

export const updatePlan = (id, body) =>
  api.patch(`/admin/plans/${id}`, body).then((r) => r.data);

export const deletePlan = (id) =>
  api.delete(`/admin/plans/${id}`).then((r) => r.data);
