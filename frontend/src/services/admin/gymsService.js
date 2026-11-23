import api from '../../utils/axiosInstance';
import { API_ENDPOINTS } from '../../config/apiEndpoints';

export async function listGyms() {
  const { data } = await api.get(API_ENDPOINTS.ADMIN_GYMS.LIST);
  return data;
}

export async function createGym(payload) {
  const { data } = await api.post(API_ENDPOINTS.ADMIN_GYMS.LIST, payload);
  return data;
}

export async function updateGym(id, payload) {
  const { data } = await api.patch(API_ENDPOINTS.ADMIN_GYMS.DETAIL(id), payload);
  return data;
}

export async function deleteGym(id) {
  const { data } = await api.delete(API_ENDPOINTS.ADMIN_GYMS.DETAIL(id));
  return data;
}

export async function getGymFeatures(id) {
  const { data } = await api.get(API_ENDPOINTS.ADMIN_GYMS.FEATURES(id));
  return data;
}

export async function setGymFeatures(id, features) {
  const { data } = await api.patch(API_ENDPOINTS.ADMIN_GYMS.FEATURES(id), {
    features,
  });
  return data;
}

export async function dashboard() {
  const { data } = await api.get(API_ENDPOINTS.ADMIN_DASHBOARD);
  return data;
}
