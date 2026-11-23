/** Non-secret UX state only — auth tokens live in HttpOnly cookies (FitPlus). */

const KEYS = {
  REALM: 'gs_auth_realm',
  GYM_ID: 'gs_gym_id',
  GYM_SLUG: 'gs_gym_slug',
  // legacy keys cleared on logout
  LEGACY: ['adminToken', 'gymToken', 'realm', 'gymId', 'gymSlug'],
};

export const storage = {
  getRealm: () => sessionStorage.getItem(KEYS.REALM),
  setRealm: (realm) => {
    if (realm) sessionStorage.setItem(KEYS.REALM, realm);
    else sessionStorage.removeItem(KEYS.REALM);
  },

  getGymId: () => sessionStorage.getItem(KEYS.GYM_ID),
  setGymId: (id) => {
    if (id) sessionStorage.setItem(KEYS.GYM_ID, id);
    else sessionStorage.removeItem(KEYS.GYM_ID);
  },

  getGymSlug: () => sessionStorage.getItem(KEYS.GYM_SLUG),
  setGymSlug: (slug) => {
    if (slug) sessionStorage.setItem(KEYS.GYM_SLUG, slug);
    else sessionStorage.removeItem(KEYS.GYM_SLUG);
  },

  clearUx() {
    sessionStorage.removeItem(KEYS.REALM);
    sessionStorage.removeItem(KEYS.GYM_ID);
    sessionStorage.removeItem(KEYS.GYM_SLUG);
    for (const key of KEYS.LEGACY) sessionStorage.removeItem(key);
  },
};
