import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius } from '../../constants/theme';
import { StreakFlame } from '../ui/StreakFlame';
import type { Habit } from '../../types';
import type { ThemeColors } from '../../constants/theme';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onComplete: () => void;
}

// Category colors based on XP weight
const CATEGORY_COLORS = ['#9CA3AF', '#E8853D', '#EF4444'];

export function HabitCard({ habit, isCompletedToday, onComplete }: HabitCardProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const scale = useSharedValue(1);
  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ translateY: xpTranslateY.value }],
  }));

  const handlePress = () => {
    if (isCompletedToday) return;

    scale.value = withSequence(
      withSpring(1.03, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    xpOpacity.value = 1;
    xpTranslateY.value = 0;
    xpOpacity.value = withTiming(0, { duration: 600 });
    xpTranslateY.value = withTiming(-40, { duration: 600 });

    onComplete();
  };

  const categoryColor = CATEGORY_COLORS[habit.xpWeight - 1];

  return (
    <Animated.View style={animatedScale}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isCompletedToday}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${habit.title}${isCompletedToday ? ', completed' : ', tap to complete'}`}
        style={[
          styles.card,
          { borderLeftColor: categoryColor, borderLeftWidth: 4 },
          isCompletedToday && styles.completed,
        ]}
      >
        <View style={styles.row}>
          {/* Left: Checkbox + Title */}
          <View style={styles.left}>
            <Ionicons
              name={isCompletedToday ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isCompletedToday ? Colors.success : Colors.text.tertiary}
            />
            <View style={styles.info}>
              <Text
                style={[styles.title, isCompletedToday && styles.titleCompleted]}
                numberOfLines={1}
              >
                {habit.title}
              </Text>
              <Text style={styles.subtitle}>
                Streak {habit.currentStreak} days
              </Text>
            </View>
          </View>

          {/* Right: Streak flame + XP */}
          <View style={styles.right}>
            <StreakFlame count={habit.currentStreak} size="sm" />
          </View>
        </View>

        {/* XP float animation */}
        <Animated.View style={[styles.xpFloat, xpAnimatedStyle]} pointerEvents="none">
          <Text style={styles.xpFloatText}>+{10 * habit.xpWeight} XP</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  completed: {
    backgroundColor: Colors.success + '10',
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  info: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  title: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  right: {
    alignItems: 'flex-end',
  },
  xpFloat: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  xpFloatText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.xp,
  },
});
