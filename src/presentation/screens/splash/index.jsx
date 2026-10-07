import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ROUTES from '../../navigation/routes';
import styles, { COLORS, SOLAR } from './styles';

const LOGO = require('../../../assets/logo.png');

const SPLASH_MIN_DURATION = 1000;

const ORBITS = [
  { color: COLORS.red, ring: SOLAR.rings[0], duration: 4000, clockwise: true },
  { color: COLORS.violet, ring: SOLAR.rings[1], duration: 6500, clockwise: false },
  { color: COLORS.blue, ring: SOLAR.rings[2], duration: 9000, clockwise: true },
];

const OrbitingDot = ({ color, ring, duration, clockwise }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, duration]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: clockwise ? ['0deg', '360deg'] : ['360deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.orbit,
        {
          width: ring,
          height: ring,
          transform: [{ rotate }],
        },
      ]}>
      <View
        style={[styles.dot, { backgroundColor: color, shadowColor: color }]}
      />
    </Animated.View>
  );
};

const SolarSystem = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const sunScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const outer = SOLAR.rings[SOLAR.rings.length - 1];

  return (
    <View
      style={[styles.solarSystem, { width: outer, height: outer }]}
      pointerEvents="none">
      {}
      {SOLAR.rings.map(size => (
        <View
          key={size}
          style={[styles.ring, { width: size, height: size }]}
        />
      ))}

      {}
      {ORBITS.map(o => (
        <OrbitingDot key={o.color} {...o} />
      ))}

      {}
      <Animated.View
        style={[styles.sunWrap, { transform: [{ scale: sunScale }] }]}>
        <Image source={LOGO} style={styles.sun} resizeMode="contain" />
      </Animated.View>
    </View>
  );
};

const Splash = () => {
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);
  const actionsFade = useRef(new Animated.Value(0)).current;
  const loginBtnRef = useRef(null);
  const createBtnRef = useRef(null);

  const openFromButton = (ref, route) => {
    const node = ref.current;
    if (!node) {
      navigation.navigate(route);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      navigation.navigate(route, { origin: { x, y, width, height } });
    });
  };

  const openLogin = () => openFromButton(loginBtnRef, ROUTES.SIGNIN);
  const openSignup = () => openFromButton(createBtnRef, ROUTES.SIGNUP);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await new Promise(res => setTimeout(res, SPLASH_MIN_DURATION));
      if (cancelled) return;
      setReady(true);
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    Animated.timing(actionsFade, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [ready, actionsFade]);

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <Text style={styles.title}>PreQuit</Text>
        <Text style={styles.subtitle}>Eye of Internet</Text>
      </View>

      {}
      <SolarSystem />

      {}
      <Animated.View
        style={[styles.actions, { opacity: actionsFade }]}
        pointerEvents={ready ? 'auto' : 'none'}>
        <Pressable
          ref={createBtnRef}
          style={[styles.button, styles.createButton]}
          onPress={openSignup}>
          <Text style={styles.createButtonText}>Create New Account</Text>
        </Pressable>
        <Pressable
          ref={loginBtnRef}
          style={[styles.button, styles.loginButton]}
          onPress={openLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Splash;
