import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from './routes';

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

export const useAppNavigation = (): AppNavigation => useNavigation<AppNavigation>();

export const useAppRoute = <T extends keyof RootStackParamList>(): RouteProp<
  RootStackParamList,
  T
> => useRoute<RouteProp<RootStackParamList, T>>();
