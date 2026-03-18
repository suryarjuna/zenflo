import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface StreakFlameProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  frozen?: boolean;
}

const SIZES = {
  sm: { icon: 16, text: Typography.xs },
  md: { icon: 24, text: Typography.base },
  lg: { icon: 36, text: Typography.xl },
};

export function StreakFlame({ count, size = 'md', frozen }: StreakFlameProps) {
  const { icon: iconSize, text: textSize } = SIZES[size];

  if (count === 0) {
    return (
      <View style={styles.container} accessibilityLabel="No streak">
        <Ionicons name="flame-outline" size={iconSize} color={Colors.text.tertiary} />
        {size !== 'sm' && (
          <Text style={[styles.text, { fontSize: textSize, color: Colors.text.tertiary }]}>Start today</Text>
        )}
      </View>
    );
  }

  const flameColor = frozen
    ? Colors.streakFrozen
    : count >= 30
    ? Colors.streakGold
    : Colors.streakFire;

  return (
    <View style={styles.container} accessibilityLabel={`${count} day streak`}>
      <Ionicons name="flame" size={iconSize} color={flameColor} />
      <Text style={[styles.text, { fontSize: textSize, color: flameColor }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  text: {
    fontWeight: '700',
  },
});
