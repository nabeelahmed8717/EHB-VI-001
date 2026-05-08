'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  role: 'seller' | 'buyer' | 'rider';
  phone: string | null;
  is_email_verified: boolean;
  has_password?: boolean;
}

export interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isAuthenticated: boolean;
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
  isHydrated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
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

    /**
     * Update just the user record without changing the token. Used after
     * actions that change role server-side (e.g. seller/rider profile
     * creation, where the backend auto-promotes user.role) so the UI
     * picks up the new role without forcing a logout/login cycle.
     */
    setUser(state, action: PayloadAction<UserPublic>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
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

export const { hydrate, setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsHydrated = (state: { auth: AuthState }) => state.auth.isHydrated;
