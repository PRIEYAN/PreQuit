import { Platform } from 'react-native';

// Android cannot reach the host loopback directly. Both the emulator and a USB
// device work once `adb reverse tcp:4000 tcp:4000` is running, which maps
// localhost:4000 on the device to port 4000 on the development machine.
// Set API_HOST at build time to point at a LAN address or a deployed API
// instead (see example.env).
const FALLBACK_HOST = Platform.select({
  android: 'http://localhost:4000',
  ios: 'http://localhost:4000',
  default: 'http://localhost:4000',
}) as string;

const DEV_HOST = (process.env.API_HOST ?? FALLBACK_HOST).replace(/\/+$/, '');

export const DataSource = {
  API: 'api',
  SEED: 'seed',
  AUTO: 'auto',
} as const;

export type DataSourceValue = (typeof DataSource)[keyof typeof DataSource];

export interface ApiConfig {
  readonly baseUrl: string;
  readonly realtimeUrl: string;
  readonly requestTimeoutMs: number;
  readonly dataSource: DataSourceValue;
}

export const apiConfig: ApiConfig = {
  baseUrl: `${DEV_HOST}/api/v1`,
  realtimeUrl: DEV_HOST,
  requestTimeoutMs: 15000,
  dataSource: (process.env.API_DATA_SOURCE as DataSourceValue) ?? DataSource.AUTO,
};

export default apiConfig;
