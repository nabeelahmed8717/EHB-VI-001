'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { hydrate } from '@/lib/store/auth.slice';

/**
 * AuthHydrator — mounts once in Providers, reads localStorage, and
 * populates the Redux auth store on the client side.
 *
 * Without this, the store starts empty after SSR (window is undefined
 * during server rendering, so localStorage cannot be read at module
 * init time).  Layouts check isHydrated before acting on isAuthenticated.
 */
export function AuthHydrator() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run exactly once on client mount

  return null;
}
