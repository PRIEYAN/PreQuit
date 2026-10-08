import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../../domain/entities/User';
import type {
  SessionRepository,
  SessionWrite,
  StoredSession,
} from '../../domain/repositories/SessionRepository';

const ACCESS_KEY = '@prequit/accessToken';
const REFRESH_KEY = '@prequit/refreshToken';
const USER_KEY = '@prequit/user';

const KEYS = [ACCESS_KEY, REFRESH_KEY, USER_KEY];

export class AsyncStorageSessionRepository implements SessionRepository {
  private access: string | null = null;
  private refresh: string | null = null;

  accessToken(): string | null {
    return this.access;
  }

  refreshToken(): string | null {
    return this.refresh;
  }

  async read(): Promise<StoredSession> {
    const stored = await AsyncStorage.getMany(KEYS);
    this.access = stored[ACCESS_KEY] ?? null;
    this.refresh = stored[REFRESH_KEY] ?? null;

    let user: User | null = null;
    const rawUser = stored[USER_KEY];
    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as User;
      } catch {
        user = null;
      }
    }

    return { accessToken: this.access, refreshToken: this.refresh, user };
  }

  async write(session: SessionWrite): Promise<void> {
    this.access = session.accessToken ?? null;
    this.refresh = session.refreshToken ?? null;

    const entries: Record<string, string> = {};
    if (session.accessToken) entries[ACCESS_KEY] = session.accessToken;
    if (session.refreshToken) entries[REFRESH_KEY] = session.refreshToken;
    if (session.user) entries[USER_KEY] = JSON.stringify(session.user);
    if (Object.keys(entries).length > 0) await AsyncStorage.setMany(entries);
  }

  async clear(): Promise<void> {
    this.access = null;
    this.refresh = null;
    await AsyncStorage.removeMany(KEYS);
  }
}

export default AsyncStorageSessionRepository;
