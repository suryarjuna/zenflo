import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { formatDate } from '../../utils/dates';
import type { Goal } from '../../types';

interface GoalCardProps {
  goal: Goal;
  progress?: { percent: number; completedTasks: number; totalTasks: number };
  onPress?: () => void;
}

export function GoalCard({ goal, progress, onPress }: GoalCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{goal.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: goal.status === 'completed' ? Colors.success + '20' : Colors.accent + '20' }]}>
          <Text style={[styles.statusText, { color: goal.status === 'completed' ? Colors.success : Colors.accent }]}>
            {goal.status}
          </Text>
        </View>
        {goal.importance && (
          <View style={styles.importanceBadge}>
            <View style={[styles.importanceDot, { backgroundColor: goal.importance === 'high' ? Colors.danger : goal.importance === 'medium' ? Colors.warning : Colors.text.tertiary }]} />
            <Text style={[styles.importanceText, { color: goal.importance === 'high' ? Colors.danger : goal.importance === 'medium' ? Colors.warning : Colors.text.tertiary }]}>
              {goal.importance === 'high' ? 'High priority' : goal.importance === 'medium' ? 'Medium priority' : 'Low priority'}
            </Text>
          </View>
        )}
      </View>

      {goal.targetDate && (
        <Text style={styles.date}>Target: {formatDate(goal.targetDate)}</Text>
      )}

      {progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress.percent * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.completedTasks}/{progress.totalTasks} tasks
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing['2xs'],
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  date: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  progressText: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  importanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2xs'],
    marginLeft: Spacing.xs,
  },
  importanceDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  importanceText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
});
