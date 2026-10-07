import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useDependencies } from '../container/DependencyProvider';
import { SessionStatus } from '../../application/auth/RestoreSessionUseCase';

const RESTORING = 'restoring';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const { useCases, onSessionLost } = useDependencies();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(RESTORING);

  useEffect(() => onSessionLost(() => {
    setUser(null);
    setStatus(SessionStatus.SIGNED_OUT);
  }), [onSessionLost]);

  useEffect(() => {
    let cancelled = false;

    useCases.restoreSession
      .execute()
      .then(restored => {
        if (cancelled) return;
        setUser(restored.user);
        setStatus(restored.status);
      })
      .catch(() => {
        if (!cancelled) setStatus(SessionStatus.SIGNED_OUT);
      });

    return () => {
      cancelled = true;
    };
  }, [useCases]);

  const signIn = useCallback(
    async (identifier, password) => {
      const signedIn = await useCases.signIn.execute(identifier, password);
      setUser(signedIn);
      setStatus(SessionStatus.SIGNED_IN);
      return signedIn;
    },
    [useCases],
  );

  const signUp = useCallback(details => useCases.signUp.execute(details), [useCases]);

  const signOut = useCallback(async () => {
    await useCases.signOut.execute();
    setUser(null);
    setStatus(SessionStatus.SIGNED_OUT);
  }, [useCases]);

  const value = useMemo(
    () => ({
      user,
      viewerId: user?.id ?? null,
      status,
      isRestoring: status === RESTORING,
      isSignedIn: status === SessionStatus.SIGNED_IN,
      signIn,
      signUp,
      signOut,
    }),
    [user, status, signIn, signUp, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside a SessionProvider');
  return session;
};

export default SessionContext;
