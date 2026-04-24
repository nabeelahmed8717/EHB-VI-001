'use client';

import { Provider } from 'react-redux';
import { store } from './store/index';
import { AuthHydrator } from '@/components/auth-hydrator';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {/* Reads localStorage once on client mount and populates auth state */}
      <AuthHydrator />
      {children}
    </Provider>
  );
}
