import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

const ADD_OPTIONS = [
  {
    key: 'task',
    label: 'Task',
    description: 'Something to get done',
    icon: 'checkbox-outline' as const,
    color: Colors.monk.primary,
    route: '/modals/add-task' as const,
  },
  {
    key: 'habit',
    label: 'Habit',
    description: 'A daily or weekly routine',
    icon: 'repeat-outline' as const,
    color: Colors.athlete.primary,
    route: '/modals/add-habit' as const,
  },
  {
    key: 'goal',
    label: 'Goal',
    description: 'A big-picture target',
    icon: 'flag-outline' as const,
    color: Colors.pilot.primary,
    route: '/modals/add-goal' as const,
  },
  {
    key: 'event',
    label: 'Event',
    description: 'Block time on your calendar',
    icon: 'calendar-outline' as const,
    color: Colors.xp,
    route: '/modals/add-event' as const,
  },
  {
    key: 'session',
    label: 'Focus Session',
    description: 'Start a timed focus block',
    icon: 'timer-outline' as const,
    color: Colors.accent,
    route: '/modals/focus-session' as const,
  },
];

export default function AddModal() {
  const handleSelect = (route: string) => {
    router.back();
    setTimeout(() => {
      router.push(route as never);
    }, 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>What would you like to add?</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.optionsList}>
          {ADD_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.key}
              style={styles.optionCard}
              onPress={() => handleSelect(option.route)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Add ${option.label}`}
            >
              <View style={[styles.iconCircle, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  optionsList: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  optionLabel: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  optionDescription: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
});
