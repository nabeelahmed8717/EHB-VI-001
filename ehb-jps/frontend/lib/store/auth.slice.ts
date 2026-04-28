import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  id: string;
  ehb_user_id: string;
  email: string;
  full_name: string;
}

interface AuthState {
  user: AuthUser | null;
  access_token: string | null;
}

const initialState: AuthState = {
  user: null,
  access_token: typeof window !== 'undefined'
    ? (sessionStorage.getItem('jps_token') ?? null)
    : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; access_token: string }>) {
      state.user = action.payload.user;
      state.access_token = action.payload.access_token;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('jps_token', action.payload.access_token);
      }
    },
    clearCredentials(state) {
      state.user = null;
      state.access_token = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('jps_token');
      }
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
