import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { DaySchedule } from '@/components/calendar/DaySchedule';

export default function CalendarModal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={28} color={Colors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>{format(selectedDate, 'MMMM yyyy')}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Week strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
                onPress={() => setSelectedDate(day)}
                accessibilityRole="button"
                accessibilityLabel={format(day, 'EEEE, MMMM d')}
              >
                <Text style={[styles.dayName, isSelected && styles.dayTextActive]}>{format(day, 'EEE')}</Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayTextActive, isToday && !isSelected && styles.dayToday]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Day schedule */}
        <View style={styles.schedule}>
          <DaySchedule date={selectedDate} />
        </View>

        {/* FAB for adding event */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/modals/add-event')}
          accessibilityRole="button"
          accessibilityLabel="Add event"
        >
          <Ionicons name="add" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text.primary },
  weekStrip: { paddingHorizontal: Spacing.md, maxHeight: 80 },
  dayChip: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    minWidth: 48,
  },
  dayChipActive: { backgroundColor: Colors.accent },
  dayName: { fontSize: Typography.xs, color: Colors.text.tertiary, marginBottom: Spacing.xs },
  dayNumber: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text.primary },
  dayTextActive: { color: Colors.text.primary },
  dayToday: { color: Colors.accent },
  schedule: { flex: 1, paddingHorizontal: Spacing.md },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
