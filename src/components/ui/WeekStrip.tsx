import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  accentColor?: string;
}

export function WeekStrip({ selectedDate, onSelectDate, accentColor = Colors.accent }: WeekStripProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={styles.container}>
      {days.map(day => {
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);
        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={[
              styles.dayItem,
              selected && [styles.daySelected, { backgroundColor: accentColor }],
            ]}
            onPress={() => onSelectDate(day)}
            accessibilityRole="button"
            accessibilityLabel={format(day, 'EEEE, MMMM d')}
            accessibilityState={{ selected }}
          >
            <Text style={[
              styles.dayName,
              selected && styles.dayNameSelected,
            ]}>
              {format(day, 'EEE')}
            </Text>
            <Text style={[
              styles.dayNumber,
              selected && styles.dayNumberSelected,
              today && !selected && { color: accentColor },
            ]}>
              {format(day, 'd')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.xl,
    minWidth: 42,
  },
  daySelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dayName: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  dayNameSelected: {
    color: Colors.text.primary,
  },
  dayNumber: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
});
