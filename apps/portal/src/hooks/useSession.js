import { useCallback, useEffect, useState } from 'react';
import { ApiError, api } from '../lib/api.js';

/**
 * Session state comes from the BFF on every load. Nothing about the client is
 * cached in the browser, so signing out anywhere ends access everywhere.
 */
export const useSession = () => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSession(await api.me());
      setBackendDown(false);
    } catch (error) {
      setSession(null);
      // 401 is "not signed in". Network / 5xx means the Mac/VPS BFF is unreachable.
      const signedOut = error instanceof ApiError && error.status === 401;
      setBackendDown(!signedOut);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api.signOut().catch(() => {});
    setSession(null);
  }, []);

  return { session, isLoading, backendDown, refresh, signOut };
};
