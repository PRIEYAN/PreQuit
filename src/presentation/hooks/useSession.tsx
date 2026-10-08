import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useDependencies } from '../container/DependencyProvider';
import {
  SessionStatus,
  type SessionStatusValue,
} from '../../application/auth/RestoreSessionUseCase';
import type { User } from '../../domain/entities/User';
import type {
  RegistrationDetails,
  RegistrationResult,
} from '../../domain/repositories/AuthRepository';

const RESTORING = 'restoring';

type Status = SessionStatusValue | typeof RESTORING;

export interface SessionContextValue {
  readonly user: User | null;
  readonly viewerId: string | null;
  readonly status: Status;
  readonly isRestoring: boolean;
  readonly isSignedIn: boolean;
  signIn(identifier: string, password: string): Promise<User>;
  signUp(details: RegistrationDetails): Promise<RegistrationResult>;
  signOut(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  readonly children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const { useCases, onSessionLost } = useDependencies();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>(RESTORING);

  useEffect(
    () =>
      onSessionLost(() => {
        setUser(null);
        setStatus(SessionStatus.SIGNED_OUT);
      }),
    [onSessionLost],
  );

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
    async (identifier: string, password: string): Promise<User> => {
      const signedIn = await useCases.signIn.execute(identifier, password);
      setUser(signedIn);
      setStatus(SessionStatus.SIGNED_IN);
      return signedIn;
    },
    [useCases],
  );

  const signUp = useCallback(
    (details: RegistrationDetails) => useCases.signUp.execute(details),
    [useCases],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await useCases.signOut.execute();
    setUser(null);
    setStatus(SessionStatus.SIGNED_OUT);
  }, [useCases]);

  const value = useMemo<SessionContextValue>(
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

export const useSession = (): SessionContextValue => {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside a SessionProvider');
  return session;
};

export default SessionContext;
