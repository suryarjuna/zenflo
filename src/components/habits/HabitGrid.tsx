import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HabitCard } from './HabitCard';
import { Colors, Typography, Spacing } from '../../constants/theme';
import type { Habit, HabitCompletion } from '../../types';

interface HabitGridProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onComplete: (habitId: string) => void;
}

export function HabitGrid({ habits, completions, onComplete }: HabitGridProps) {
  const completedIds = new Set(completions.map(c => c.habitId));

  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Add your first habit. It earns you XP every day.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          isCompletedToday={completedIds.has(habit.id)}
          onComplete={() => onComplete(habit.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  empty: {
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
