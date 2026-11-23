import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as adminAuth from '@/services/admin/authService';
import * as gymAuth from '@/services/gym/authService';
import { storage } from '@/utils/storage';

const AuthContext = createContext(null);

function rememberAdminSession(user) {
  storage.setRealm('admin');
  // Keep gym cookie intact — dual-session like FitPlus
}

function rememberGymSession(user) {
  storage.setRealm('gym');
  storage.setGymId(user?.gymId);
  storage.setGymSlug(user?.gymSlug);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearLocal = useCallback(() => {
    storage.clearUx();
    setUser(null);
  }, []);

  const hydrate = useCallback(async () => {
    const path = window.location.pathname || '';
    let realm = storage.getRealm();

    if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
      realm = 'admin';
      storage.setRealm('admin');
    } else if (path.startsWith('/gym/')) {
      realm = 'gym';
      storage.setRealm('gym');
      const parts = path.split('/');
      if (parts[2] && !storage.getGymSlug()) storage.setGymSlug(parts[2]);
    }

    if (!realm) {
      setLoading(false);
      return;
    }

    try {
      if (realm === 'admin') {
        const data = await adminAuth.me();
        setUser(data);
      } else {
        const data = await gymAuth.me();
        rememberGymSession(data);
        setUser(data);
      }
    } catch {
      // Cookie missing/expired for this route's realm
      setUser(null);
      if (realm === 'gym') {
        storage.setGymId(null);
        storage.setGymSlug(null);
      }
      storage.setRealm(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const adminLogin = async (email, password) => {
    const data = await adminAuth.login(email, password);
    if (data.requires2fa) return data;
    rememberAdminSession(data.user);
    setUser(data.user);
    return data;
  };

  const adminVerify2fa = async (payload) => {
    const data = await adminAuth.verify2fa(payload);
    rememberAdminSession(data.user);
    setUser(data.user);
    return data;
  };

  const gymLogin = async (slug, email, password) => {
    const data = await gymAuth.login(slug, email, password);
    if (data.requires2fa) return data;
    rememberGymSession(data.user);
    setUser(data.user);
    return data;
  };

  const gymVerify2fa = async (payload) => {
    const data = await gymAuth.verify2fa(payload);
    rememberGymSession(data.user);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    const realm = user?.realm || storage.getRealm();
    try {
      if (realm === 'admin') await adminAuth.logout();
      else if (realm === 'gym') await gymAuth.logout();
    } catch {
      // still clear local UX
    }
    clearLocal();
  };

  const hasPermission = useCallback(
    (key) => Boolean(user?.permissions?.includes(key)),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      adminLogin,
      adminVerify2fa,
      gymLogin,
      gymVerify2fa,
      logout,
      hasPermission,
      appName: import.meta.env.VITE_APP_NAME || 'Gym Stack Management',
    }),
    [user, loading, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
