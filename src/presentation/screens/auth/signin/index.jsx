import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles, { COLORS } from './styles';
import ROUTES from '../../../navigation/routes';
import { useSession } from '../../../hooks/useSession';

const BUTTON_RADIUS = 0;
const EXPAND_MS = 340;

const SignIn = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const origin =
    route.params?.origin ??
    { x: width * 0.1, y: height * 0.75, width: width * 0.8, height: 52 };

  const progress = useSharedValue(0);
  const { signIn } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState(null);

  const scaleX = origin.width / width;
  const scaleY = origin.height / height;

  const originCenterX = origin.x + origin.width / 2;
  const originCenterY = origin.y + origin.height / 2;
  const translateX = originCenterX - width / 2;
  const translateY = originCenterY - height / 2;

  const expand = useCallback(() => {
    progress.value = withTiming(1, {
      duration: EXPAND_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const close = useCallback(() => {
    progress.value = withTiming(
      0,
      { duration: EXPAND_MS, easing: Easing.in(Easing.cubic) },
      finished => {
        'worklet';
        if (finished) {
          scheduleOnRN(navigation.goBack);
        }
      },
    );
  }, [progress, navigation]);

  React.useEffect(() => {
    expand();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [expand, close]);

  const submit = useCallback(async () => {
    if (isSubmitting) return;
    if (!identifier.trim() || !password) {
      setFailure('Enter your username and password.');
      return;
    }

    setIsSubmitting(true);
    setFailure(null);

    try {
      await signIn(identifier, password);
    } catch (error) {
      setFailure(error?.message ?? 'Could not sign you in.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, identifier, password, signIn]);

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      borderRadius: interpolate(p, [0, 1], [BUTTON_RADIUS, 0]),
      transform: [
        { translateX: interpolate(p, [0, 1], [translateX, 0]) },
        { translateY: interpolate(p, [0, 1], [translateY, 0]) },
        { scaleX: interpolate(p, [0, 1], [scaleX, 1]) },
        { scaleY: interpolate(p, [0, 1], [scaleY, 1]) },
      ],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0.55, 1], [0, 1], 'clamp'),
      transform: [{ translateY: interpolate(p, [0.55, 1], [16, 0], 'clamp') }],
    };
  });

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.panel, { width, height }, panelStyle]}>
        <Animated.View
          style={[
            styles.content,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
            contentStyle,
          ]}>
          <Pressable style={styles.backRow} onPress={close} hitSlop={12}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>We're so excited to see you again!</Text>

          <Text style={styles.sectionLabel}>ACCOUNT INFORMATION</Text>

          <View style={styles.field}>
            <TextInput
              style={styles.input}
              placeholder="Email or Username"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <View style={styles.field}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.placeholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
              returnKeyType="go"
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword(v => !v)}
              hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.white}
              />
            </Pressable>
          </View>

          <Pressable
            hitSlop={6}
            onPress={() => navigation.navigate(ROUTES.RESET_PASSWORD)}>
            <Text style={styles.forgot}>Forgot your password?</Text>
          </Pressable>

          {failure ? <Text style={styles.failure}>{failure}</Text> : null}

          <Pressable
            style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
            onPress={submit}
            disabled={isSubmitting}>
            <Text style={styles.loginButtonText}>{isSubmitting ? 'Logging in…' : 'Log In'}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default SignIn;
