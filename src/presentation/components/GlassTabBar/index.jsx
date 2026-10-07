import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import { COLORS } from '../../theme';
import styles from './styles';

const ICONS = {
  TabHome: { on: 'home', off: 'home-outline' },
  TabSocial: { on: 'chatbubbles', off: 'chatbubbles-outline' },
  TabFriends: { on: 'people', off: 'people-outline' },
  TabProfile: { on: 'person', off: 'person-outline' },
};

const LABELS = {
  TabHome: 'Home',
  TabSocial: 'Social',
  TabFriends: 'Friends',
  TabProfile: 'Profile',
};

const TabItem = ({ routeName, focused, onPress }) => {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, focus]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(focus.value, [0, 1], [0, -6]) }],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [
      { translateY: interpolate(focus.value, [0, 1], [0, -6]) },
      { scale: interpolate(focus.value, [0, 1], [0.6, 1]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
  }));

  const icon = ICONS[routeName] ?? { on: 'ellipse', off: 'ellipse-outline' };

  return (
    <Pressable style={styles.tab} onPress={onPress} hitSlop={8}>
      <Animated.View style={[styles.circle, circleStyle]} />
      <Animated.View style={iconStyle}>
        <Ionicons
          name={focused ? icon.on : icon.off}
          size={24}
          color={focused ? COLORS.white : COLORS.textMuted}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {LABELS[routeName] ?? routeName}
      </Animated.Text>
    </Pressable>
  );
};

const GlassTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + 12 }]}
      pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

export default GlassTabBar;
