import api from '../../utils/axiosInstance';
import { API_ENDPOINTS } from '../../config/apiEndpoints';

export async function login(email, password) {
  const { data } = await api.post(API_ENDPOINTS.ADMIN_AUTH.LOGIN, {
    email,
    password,
  });
  return data;
}

export async function verify2fa({ email, challengeId, otp }) {
  const { data } = await api.post(API_ENDPOINTS.ADMIN_AUTH.VERIFY_2FA, {
    email,
    challengeId,
    otp,
  });
  return data;
}

export async function me() {
  const { data } = await api.get(API_ENDPOINTS.ADMIN_AUTH.ME);
  return data;
}

export async function logout() {
  const { data } = await api.post(API_ENDPOINTS.ADMIN_AUTH.LOGOUT);
  return data;
}
