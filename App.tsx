import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependencyProvider } from './src/presentation/container/DependencyProvider';
import { SessionProvider } from './src/presentation/hooks/useSession';
import RootNavigator from './src/presentation/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <DependencyProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </DependencyProvider>
    </SafeAreaProvider>
  );
}

export default App;
