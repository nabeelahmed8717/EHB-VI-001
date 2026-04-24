'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  role: 'seller' | 'buyer';
  /** true = has a local password (can use GoSellr login directly) */
  has_password?: boolean;
}

export interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isAuthenticated: boolean;
  /**
   * false on first SSR render (localStorage not available yet).
   * Flips to true after AuthHydrator runs on the client.
   * Layouts must NOT redirect until isHydrated === true.
   */
  isHydrated: boolean;
}

const TOKEN_KEY = 'gosellr_token';
const USER_KEY = 'gosellr_user';

function loadFromStorage(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated'> {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false };
  }
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (token && userRaw) {
      const user = JSON.parse(userRaw) as UserPublic;
      return { token, user, isAuthenticated: true };
    }
  } catch {
    // corrupted storage — treat as logged out
  }
  return { user: null, token: null, isAuthenticated: false };
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false, // always false at startup — AuthHydrator sets it to true on mount
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called once by AuthHydrator on client mount.
     * Reads localStorage and marks the store as hydrated so layouts
     * can safely check isAuthenticated without causing false redirects.
     */
    hydrate(state) {
      const saved = loadFromStorage();
      state.user = saved.user;
      state.token = saved.token;
      state.isAuthenticated = saved.isAuthenticated;
      state.isHydrated = true;
    },

    setCredentials(state, action: PayloadAction<{ user: UserPublic; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isHydrated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      }
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isHydrated = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    },
  },
});

export const { hydrate, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
