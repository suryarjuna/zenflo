import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i === current && dotStyles.active]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', paddingVertical: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.background.tertiary },
  active: { backgroundColor: Colors.accent, width: 24 },
});

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const wordmarkOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const moonOpacity = useSharedValue(0);
  const flameOpacity = useSharedValue(0);
  const compassOpacity = useSharedValue(0);

  useEffect(() => {
    wordmarkOpacity.value = withTiming(1, { duration: 800 });
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    nameOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    moonOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
    flameOpacity.value = withDelay(1700, withTiming(1, { duration: 400 }));
    compassOpacity.value = withDelay(2000, withTiming(1, { duration: 400 }));
  }, []);

  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmarkOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const nameStyle = useAnimatedStyle(() => ({ opacity: nameOpacity.value }));
  const moonStyle = useAnimatedStyle(() => ({ opacity: moonOpacity.value }));
  const flameStyle = useAnimatedStyle(() => ({ opacity: flameOpacity.value }));
  const compassStyle = useAnimatedStyle(() => ({ opacity: compassOpacity.value }));

  const handleNext = async () => {
    if (name.trim()) {
      await AsyncStorage.setItem('zenflo_onboarding_name', name.trim());
    }
    router.push('/onboarding/goal');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressDots current={0} total={5} />
      <View style={styles.container}>
        <View style={styles.center}>
          <Animated.View style={[styles.logoRow, wordmarkStyle]}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.wordmark}>ZENFLO</Text>
          </Animated.View>
          <Animated.Text style={[styles.tagline, taglineStyle]}>
            Get in the zone. Own your week.
          </Animated.Text>
          <Animated.View style={[styles.nameContainer, nameStyle]}>
            <TextInput
              style={styles.nameInput}
              placeholder="What's your name?"
              placeholderTextColor={Colors.text.tertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Your name"
            />
          </Animated.View>
          <View style={styles.icons}>
            <Animated.View style={moonStyle}>
              <Ionicons name="moon" size={36} color={Colors.monk.primary} />
            </Animated.View>
            <Animated.View style={flameStyle}>
              <Ionicons name="flame" size={36} color={Colors.athlete.primary} />
            </Animated.View>
            <Animated.View style={compassStyle}>
              <Ionicons name="compass" size={36} color={Colors.pilot.primary} />
            </Animated.View>
          </View>
        </View>
        <View style={styles.bottom}>
          <Button
            label="Let's build your flow"
            onPress={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export { ProgressDots };

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  wordmark: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.black,
    color: Colors.text.primary,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: Typography.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  nameContainer: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  nameInput: {
    fontSize: Typography.lg,
    color: Colors.text.primary,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingVertical: Spacing.md,
  },
  icons: {
    flexDirection: 'row',
    gap: Spacing['2xl'],
    marginTop: Spacing.xl,
  },
  bottom: {
    paddingTop: Spacing.xl,
  },
});
