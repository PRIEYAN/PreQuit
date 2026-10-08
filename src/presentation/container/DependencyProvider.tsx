import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createContainer, type AppContainer, type UseCases } from './createContainer';

const DependencyContext = createContext<AppContainer | null>(null);

export interface DependencyProviderProps {
  readonly container?: AppContainer | null;
  readonly children: ReactNode;
}

export const DependencyProvider = ({ container = null, children }: DependencyProviderProps) => {
  const value = useMemo(() => container ?? createContainer(), [container]);
  return <DependencyContext.Provider value={value}>{children}</DependencyContext.Provider>;
};

export const useDependencies = (): AppContainer => {
  const container = useContext(DependencyContext);
  if (!container) throw new Error('useDependencies must be used inside a DependencyProvider');
  return container;
};

export const useUseCases = (): UseCases => useDependencies().useCases;

export default DependencyContext;
