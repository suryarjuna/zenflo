import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface TodayProgressProps {
  completedCount: number;
  totalCount: number;
  accentColor?: string;
}

export function TodayProgress({ completedCount, totalCount, accentColor = Colors.accent }: TodayProgressProps) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const today = format(new Date(), 'EEEE, d MMMM');

  return (
    <View style={[styles.card, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>Today's tasks</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={[styles.progressPercent, { color: accentColor }]}>{percent}%</Text>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    gap: Spacing['2xs'],
  },
  label: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  date: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  progressSection: {
    alignItems: 'flex-end',
    gap: Spacing['2xs'],
  },
  progressLabel: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  progressPercent: {
    fontSize: Typography.xl,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
