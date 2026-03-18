import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { formatDate } from '../../utils/dates';
import type { FlightLog } from '../../types';

interface FlightLogCardProps {
  log: FlightLog;
  onPress?: () => void;
}

export function FlightLogCard({ log, onPress }: FlightLogCardProps) {
  const scoreColor = log.habitScore < 40 ? Colors.danger : log.habitScore < 70 ? Colors.warning : Colors.success;

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.weekDate}>Week of {formatDate(log.weekStartDate, 'MMM d')}</Text>
        <Text style={[styles.score, { color: scoreColor }]}>{log.habitScore}%</Text>
      </View>
      <View style={styles.stats}>
        <Text style={styles.stat}>{log.tasksCompleted} tasks</Text>
        <Text style={styles.stat}>{log.xpEarned} XP</Text>
        <Text style={styles.stat}>{log.longestStreak}d streak</Text>
      </View>
      {log.bestMoment && (
        <Text style={styles.moment} numberOfLines={2}>"{log.bestMoment}"</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  weekDate: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  score: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  stat: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  moment: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
});
