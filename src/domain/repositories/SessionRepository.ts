import type { User } from '../entities/User';

export interface StoredSession {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: User | null;
}

export interface SessionWrite {
  readonly accessToken?: string | null;
  readonly refreshToken?: string | null;
  readonly user?: User | null;
}

export interface SessionRepository {
  read(): Promise<StoredSession>;
  write(session: SessionWrite): Promise<void>;
  clear(): Promise<void>;
  accessToken(): string | null;
  refreshToken(): string | null;
}
