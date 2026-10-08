import { Platform } from 'react-native';

const DEV_HOST = Platform.select({
  android: 'http://10.0.2.2:4000',
  ios: 'http://localhost:4000',
  default: 'http://localhost:4000',
}) as string;

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
  dataSource: DataSource.AUTO,
};

export default apiConfig;
