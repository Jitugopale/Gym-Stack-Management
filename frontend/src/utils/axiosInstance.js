import axios from 'axios';
import { storage } from '@/utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const realm = storage.getRealm();
  const gymId = storage.getGymId();
  if (gymId && realm === 'gym') {
    config.headers['x-gym-id'] = gymId;
  }

  if (import.meta.env.VITE_API_KEY) {
    config.headers['x-api-key'] = import.meta.env.VITE_API_KEY;
  }
  if (import.meta.env.VITE_CLIENT_ID) {
    config.headers['x-client-id'] = import.meta.env.VITE_CLIENT_ID;
  }
  if (import.meta.env.VITE_CLIENT_SECRET) {
    config.headers['x-client-secret'] = import.meta.env.VITE_CLIENT_SECRET;
  }

  return config;
});

export default api;
