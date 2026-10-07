import { Platform } from 'react-native';

const DEV_HOST = Platform.select({
  android: 'http://10.0.2.2:4000',
  ios: 'http://localhost:4000',
  default: 'http://localhost:4000',
});

export const DataSource = {
  API: 'api',
  SEED: 'seed',
  AUTO: 'auto',
};

export const apiConfig = {
  baseUrl: `${DEV_HOST}/api/v1`,
  realtimeUrl: DEV_HOST,
  requestTimeoutMs: 15000,
  dataSource: DataSource.AUTO,
};

export default apiConfig;
