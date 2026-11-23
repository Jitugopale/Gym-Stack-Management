import api from '../../utils/axiosInstance';
import { API_ENDPOINTS } from '../../config/apiEndpoints';

export async function login(slug, email, password) {
  const { data } = await api.post(API_ENDPOINTS.GYM_AUTH.LOGIN(slug), {
    email,
    password,
  });
  return data;
}

export async function verify2fa({ slug, email, challengeId, otp }) {
  const { data } = await api.post(API_ENDPOINTS.GYM_AUTH.VERIFY_2FA(slug), {
    email,
    challengeId,
    otp,
  });
  return data;
}

export async function me() {
  const { data } = await api.get(API_ENDPOINTS.GYM_AUTH.ME);
  return data;
}

export async function logout() {
  const { data } = await api.post(API_ENDPOINTS.GYM_AUTH.LOGOUT);
  return data;
}

export async function publicGym(slug) {
  const { data } = await api.get(API_ENDPOINTS.GYM_PUBLIC.BY_SLUG(slug));
  return data;
}
