import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionRepository } from '../../domain/repositories/SessionRepository';

const ACCESS_KEY = '@prequit/accessToken';
const REFRESH_KEY = '@prequit/refreshToken';
const USER_KEY = '@prequit/user';

export class AsyncStorageSessionRepository extends SessionRepository {
  constructor() {
    super();
    this.access = null;
    this.refresh = null;
  }

  accessToken() {
    return this.access;
  }

  refreshToken() {
    return this.refresh;
  }

  async read() {
    const entries = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY, USER_KEY]);
    const map = Object.fromEntries(entries);
    this.access = map[ACCESS_KEY] ?? null;
    this.refresh = map[REFRESH_KEY] ?? null;

    let user = null;
    if (map[USER_KEY]) {
      try {
        user = JSON.parse(map[USER_KEY]);
      } catch {
        user = null;
      }
    }

    return { accessToken: this.access, refreshToken: this.refresh, user };
  }

  async write({ accessToken, refreshToken, user }) {
    this.access = accessToken ?? null;
    this.refresh = refreshToken ?? null;

    const pairs = [];
    if (accessToken) pairs.push([ACCESS_KEY, accessToken]);
    if (refreshToken) pairs.push([REFRESH_KEY, refreshToken]);
    if (user) pairs.push([USER_KEY, JSON.stringify(user)]);
    if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
  }

  async clear() {
    this.access = null;
    this.refresh = null;
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, USER_KEY]);
  }
}

export default AsyncStorageSessionRepository;
