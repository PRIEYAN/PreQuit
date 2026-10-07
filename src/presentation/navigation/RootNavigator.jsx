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
import { useSession } from '../hooks/useSession';

const Stack = createNativeStackNavigator();

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

const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'fade',
  contentStyle: { backgroundColor: '#000000' },
};

const MORPH_OPTIONS = {
  animation: 'none',
  presentation: 'transparentModal',
};

const AuthStack = () => (
  <>
    <Stack.Screen name={ROUTES.SPLASH} component={Splash} />
    <Stack.Screen name={ROUTES.ONBOARD} component={OnBoard} />
    <Stack.Screen name={ROUTES.SIGNIN} component={SignIn} options={MORPH_OPTIONS} />
    <Stack.Screen name={ROUTES.SIGNUP} component={SignUp} options={MORPH_OPTIONS} />
    <Stack.Screen name={ROUTES.RESET_PASSWORD} component={ResetPassword} />
  </>
);

const AppStack = () => (
  <>
    <Stack.Screen name={ROUTES.MAIN} component={MainTabs} />
    <Stack.Screen name={ROUTES.SETTINGS} component={Settings} />
    <Stack.Screen name={ROUTES.DM} component={DM} options={{ animation: 'slide_from_right' }} />
  </>
);

const RootNavigator = () => {
  const { isSignedIn } = useSession();

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
        {isSignedIn ? AppStack() : AuthStack()}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
