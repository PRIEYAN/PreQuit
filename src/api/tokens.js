import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = '@prequit/accessToken';
const REFRESH_KEY = '@prequit/refreshToken';
const USER_KEY = '@prequit/user';

/**
 * Token storage. Kept in memory as well as on disk so the request path never
 * awaits AsyncStorage: reading it per request would add latency to every call.
 */
let accessToken = null;
let refreshToken = null;

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export async function loadSession() {
  const entries = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY, USER_KEY]);
  const map = Object.fromEntries(entries);
  accessToken = map[ACCESS_KEY] ?? null;
  refreshToken = map[REFRESH_KEY] ?? null;
  const rawUser = map[USER_KEY];
  let user = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      // A corrupt cache must not block startup — the profile refetches anyway.
      user = null;
    }
  }
  return { accessToken, refreshToken, user };
}

export async function saveSession({ accessToken: access, refreshToken: refresh, user }) {
  accessToken = access ?? null;
  refreshToken = refresh ?? null;
  const pairs = [];
  if (access) pairs.push([ACCESS_KEY, access]);
  if (refresh) pairs.push([REFRESH_KEY, refresh]);
  if (user) pairs.push([USER_KEY, JSON.stringify(user)]);
  if (pairs.length) await AsyncStorage.multiSet(pairs);
}

export async function clearSession() {
  accessToken = null;
  refreshToken = null;
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, USER_KEY]);
}

export default { getAccessToken, getRefreshToken, loadSession, saveSession, clearSession };
