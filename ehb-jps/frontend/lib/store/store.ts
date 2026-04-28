import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import { profilesApi } from './api/profiles.api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [profilesApi.reducerPath]: profilesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(profilesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
