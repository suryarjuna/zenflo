import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius } from '../../constants/theme';
import type { Task } from '../../types';
import type { ThemeColors } from '../../constants/theme';

interface TaskItemProps {
  task: Task;
  onComplete: () => void;
  onPress?: () => void;
}

export function TaskItem({ task, onComplete, onPress }: TaskItemProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const scale = useSharedValue(1);
  const isCompleted = task.status === 'completed';

  const PRIORITY_COLORS = {
    high: Colors.danger,
    medium: Colors.warning,
    low: Colors.text.tertiary,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleComplete = () => {
    if (isCompleted) return;
    scale.value = withSequence(
      withSpring(0.95, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}, priority ${task.priority}${isCompleted ? ', completed' : ''}`}
        style={styles.container}
      >
        <TouchableOpacity
          onPress={handleComplete}
          disabled={isCompleted}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="checkbox"
          accessibilityLabel={`Mark ${task.title} as complete`}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isCompleted ? Colors.success : PRIORITY_COLORS[task.priority]}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, isCompleted && styles.completedText]} numberOfLines={1}>
            {task.title}
          </Text>
          {task.dueDate && (
            <Text style={styles.dueDate}>{task.dueDate}</Text>
          )}
        </View>

        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  content: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.text.primary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  dueDate: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
});
