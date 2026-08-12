import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ROUTES from './routes';
import GlassTabBar from '../components/GlassTabBar';

import Feed from '../screens/dashboard/feed';
import Search from '../screens/dashboard/search';
import Friends from '../screens/friends/friends';
import Personal from '../screens/profile/personal';

const Tab = createBottomTabNavigator();

// Defined at module scope so it isn't recreated each render.
const renderTabBar = props => <GlassTabBar {...props} />;

// Post-auth shell: 4 tabs (Feed / Search / Friends / Profile) rendered
// with a custom floating glass tab bar. Screens keep their own pure-black
// backgrounds; the bar floats over them.
const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#000000' },
      }}>
      <Tab.Screen name={ROUTES.TAB_HOME} component={Feed} />
      <Tab.Screen name={ROUTES.TAB_SOCIAL} component={Search} />
      <Tab.Screen name={ROUTES.TAB_FRIENDS} component={Friends} />
      <Tab.Screen name={ROUTES.TAB_PROFILE} component={Personal} />
    </Tab.Navigator>
  );
};

export default MainTabs;
