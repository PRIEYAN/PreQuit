import { Platform } from 'react-native';

// The Android emulator reaches the host machine on 10.0.2.2, not localhost —
// localhost there is the emulator itself. iOS simulators share the host loopback.
// Point this at your deployed API for a real build.
const DEV_HOST = Platform.select({
  android: 'http://10.0.2.2:4000',
  ios: 'http://localhost:4000',
  default: 'http://localhost:4000',
});

export const API_BASE_URL = `${DEV_HOST}/api/v1`;

// Fail a request rather than let a screen spin forever on a dead network.
export const REQUEST_TIMEOUT_MS = 15000;

export default { API_BASE_URL, REQUEST_TIMEOUT_MS };
