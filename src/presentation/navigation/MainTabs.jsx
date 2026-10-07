import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ROUTES from './routes';
import GlassTabBar from '../components/GlassTabBar';

import Feed from '../screens/dashboard/feed';
import Search from '../screens/dashboard/search';
import Friends from '../screens/friends/friends';
import Personal from '../screens/profile/personal';

const Tab = createBottomTabNavigator();

const renderTabBar = props => <GlassTabBar {...props} />;

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#000000' },
      }}>
      <Tab.Screen name={ROUTES.TAB_HOME} component={Search} />
      <Tab.Screen name={ROUTES.TAB_SOCIAL} component={Feed} />
      <Tab.Screen name={ROUTES.TAB_FRIENDS} component={Friends} />
      <Tab.Screen name={ROUTES.TAB_PROFILE} component={Personal} />
    </Tab.Navigator>
  );
};

export default MainTabs;
