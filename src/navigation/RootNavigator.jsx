import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ROUTES from './routes';

import MainTabs from './MainTabs';
import Splash from '../screens/splash';
import OnBoard from '../screens/auth/onBoard';
import SignIn from '../screens/auth/signin';
import SignUp from '../screens/auth/signup';
import ResetPassword from '../screens/auth/resetpassword';
import Settings from '../screens/profile/settings';
import DM from '../screens/friends/dm';

const Stack = createNativeStackNavigator();

// Pure-black navigation theme so there is no white flash between screens.
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000000',
    card: '#000000',
    text: '#FFFFFF',
    primary: '#FFFFFF',
  },
};

const RootNavigator = () => {
  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        initialRouteName={ROUTES.SPLASH}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#000000' },
        }}>
        {/* Entry */}
        <Stack.Screen name={ROUTES.SPLASH} component={Splash} />

        {/* Auth */}
        <Stack.Screen name={ROUTES.ONBOARD} component={OnBoard} />
        <Stack.Screen
          name={ROUTES.SIGNIN}
          component={SignIn}
          options={{
            // We drive the "expand from button" morph ourselves inside
            // the screen, so disable the stack's own animation and let
            // the splash stay visible underneath during the expand.
            animation: 'none',
            presentation: 'transparentModal',
          }}
        />
        <Stack.Screen
          name={ROUTES.SIGNUP}
          component={SignUp}
          options={{
            // Same self-driven "expand from button" morph as SignIn.
            animation: 'none',
            presentation: 'transparentModal',
          }}
        />
        <Stack.Screen name={ROUTES.RESET_PASSWORD} component={ResetPassword} />

        {/* Main app shell — the 4-tab floating glass nav */}
        <Stack.Screen name={ROUTES.MAIN} component={MainTabs} />

        {/* Standalone routes reachable from within tabs (deep navigation) */}
        <Stack.Screen name={ROUTES.SETTINGS} component={Settings} />
        <Stack.Screen
          name={ROUTES.DM}
          component={DM}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
