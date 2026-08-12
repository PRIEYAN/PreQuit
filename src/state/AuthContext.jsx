import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { auth as authApi } from '../api/endpoints';
import { setUnauthorizedHandler } from '../api/client';
import { loadSession, saveSession, clearSession } from '../api/tokens';

const AuthContext = createContext(null);

/**
 * Owns the session for the whole app: restores it on launch, exposes
 * sign-in/up/out, and clears it when the API reports the refresh token is
 * no longer valid.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('restoring');

  const signOut = useCallback(async () => {
    // Best-effort server-side revoke; local state is cleared either way so a
    // network failure cannot strand the user in a signed-in shell.
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    await clearSession();
    setUser(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await loadSession();
      if (cancelled) return;
      if (!stored.accessToken) {
        setStatus('signedOut');
        return;
      }
      // Show the cached user immediately, then confirm with the server so a
      // revoked session does not present a signed-in shell.
      if (stored.user) setUser(stored.user);
      try {
        const me = await authApi.me();
        if (cancelled) return;
        setUser(me);
        await saveSession({ ...stored, user: me });
        setStatus('signedIn');
      } catch (err) {
        if (cancelled) return;
        // Offline with a stored session: stay signed in and retry later
        // rather than forcing a sign-in the user cannot complete.
        if (err.isNetworkError && stored.user) {
          setStatus('signedIn');
          return;
        }
        await clearSession();
        setUser(null);
        setStatus('signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (identifier, password) => {
    const result = await authApi.login(identifier, password);
    await saveSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
    setUser(result.user);
    setStatus('signedIn');
    return result.user;
  }, []);

  const signUp = useCallback(async details => {
    // Registration does not return a session — the account must verify its
    // email first, so the caller routes to the verification step.
    return authApi.register(details);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isSignedIn: status === 'signedIn',
      isRestoring: status === 'restoring',
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, status, signIn, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};

export default AuthContext;
