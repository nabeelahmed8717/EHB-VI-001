import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  adminKey: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  adminKey: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<{ adminKey: string }>) => {
      state.isAuthenticated = true;
      state.adminKey = action.payload.adminKey;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.adminKey = null;
    },
  },
});

export const { setAuthenticated, clearAuth } = authSlice.actions;
export default authSlice.reducer;
