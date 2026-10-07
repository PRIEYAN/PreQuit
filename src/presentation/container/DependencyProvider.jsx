import React, { createContext, useContext, useMemo } from 'react';

import { createContainer } from './createContainer';

const DependencyContext = createContext(null);

export const DependencyProvider = ({ container = null, children }) => {
  const value = useMemo(() => container ?? createContainer(), [container]);
  return <DependencyContext.Provider value={value}>{children}</DependencyContext.Provider>;
};

export const useDependencies = () => {
  const container = useContext(DependencyContext);
  if (!container) throw new Error('useDependencies must be used inside a DependencyProvider');
  return container;
};

export const useUseCases = () => useDependencies().useCases;

export default DependencyContext;
