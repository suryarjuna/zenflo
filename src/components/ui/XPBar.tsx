import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useColors, ThemeColors, Typography, Spacing, Radius } from '../../constants/theme';
import { getLevelTier } from '../../constants/levels';

interface XPBarProps {
  currentXP: number;
  totalXP: number;
  level?: number;
}

export function XPBar({ currentXP, totalXP, level }: XPBarProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const progress = useSharedValue(0);
  const percent = totalXP > 0 ? currentXP / totalXP : 0;

  useEffect(() => {
    progress.value = withTiming(percent, { duration: 500 });
  }, [percent]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%` as `${number}%`,
  }));

  const tier = level ? getLevelTier(level) : null;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        {tier && <Text style={styles.levelName}>{tier.name}</Text>}
        <Text style={styles.xpText}>{currentXP} / {totalXP} XP</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedStyle]} />
      </View>
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  xpText: {
    fontSize: Typography.xs,
    color: Colors.text.secondary,
  },
  track: {
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.xp,
    borderRadius: Radius.full,
  },
});
