import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, Typography, Spacing, Radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressDots } from './welcome';
import type { HabitFrequency } from '@/types';

interface HabitInput {
  title: string;
  frequency: HabitFrequency;
}

const FREQUENCIES: { label: string; value: HabitFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays', value: 'weekdays' },
];

export default function HabitsScreen() {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const [goalTitle, setGoalTitle] = useState('');
  const [habits, setHabits] = useState<HabitInput[]>([
    { title: '', frequency: 'daily' },
    { title: '', frequency: 'daily' },
    { title: '', frequency: 'daily' },
  ]);

  useEffect(() => {
    AsyncStorage.getItem('zenflo_onboarding_goal').then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        setGoalTitle(parsed.title);
      }
    });
  }, []);

  const updateHabit = (index: number, field: keyof HabitInput, value: string) => {
    setHabits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const filledHabits = habits.filter(h => h.title.trim());
  const canProceed = filledHabits.length >= 1;

  const handleNext = async () => {
    const habitsToSave = habits.filter(h => h.title.trim());
    await AsyncStorage.setItem('zenflo_onboarding_habits', JSON.stringify(habitsToSave));
    router.push('/onboarding/xp-weights');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressDots current={2} total={5} />
      <View style={styles.container}>
        <View style={styles.top}>
          {goalTitle && (
            <Card style={styles.goalCard}>
              <Text style={styles.goalLabel}>Your goal</Text>
              <Text style={styles.goalTitle}>{goalTitle}</Text>
            </Card>
          )}

          <Text style={styles.heading}>What 3 habits will get you there?</Text>

          <View style={styles.habitList}>
            {habits.map((habit, index) => (
              <View key={index} style={styles.habitRow}>
                <View style={styles.habitInputRow}>
                  <Text style={styles.habitNumber}>{index + 1}.</Text>
                  <TextInput
                    style={styles.habitInput}
                    placeholder={index === 0 ? 'e.g. Meditate 10 minutes' : index === 1 ? 'e.g. Exercise 30 minutes' : 'e.g. Read 20 pages'}
                    placeholderTextColor={Colors.text.tertiary}
                    value={habit.title}
                    onChangeText={(text) => updateHabit(index, 'title', text)}
                    accessibilityLabel={`Habit ${index + 1} title`}
                  />
                </View>
                {habit.title.trim() && (
                  <View style={styles.freqRow}>
                    {FREQUENCIES.map((freq) => (
                      <TouchableOpacity
                        key={freq.value}
                        style={[
                          styles.freqChip,
                          habit.frequency === freq.value && styles.freqChipActive,
                        ]}
                        onPress={() => updateHabit(index, 'frequency', freq.value)}
                        accessibilityRole="radio"
                        accessibilityLabel={freq.label}
                        accessibilityState={{ selected: habit.frequency === freq.value }}
                      >
                        <Text style={[
                          styles.freqText,
                          habit.frequency === freq.value && styles.freqTextActive,
                        ]}>
                          {freq.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.hint}>Minimum 1 habit required</Text>
        </View>

        <View style={styles.bottom}>
          <Button
            label="These are my habits"
            onPress={handleNext}
            disabled={!canProceed}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  top: {
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  goalCard: {
    backgroundColor: Colors.background.tertiary,
  },
  goalLabel: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  goalTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  heading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text.primary,
    lineHeight: 38,
  },
  habitList: {
    gap: Spacing.lg,
  },
  habitRow: {
    gap: Spacing.sm,
  },
  habitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  habitNumber: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text.tertiary,
    width: 24,
  },
  habitInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingVertical: Spacing.sm,
  },
  freqRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingLeft: 36,
  },
  freqChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.background.tertiary,
  },
  freqChipActive: {
    backgroundColor: Colors.accent,
  },
  freqText: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  freqTextActive: {
    color: Colors.text.primary,
    fontWeight: Typography.semibold,
  },
  hint: {
    fontSize: Typography.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  bottom: {
    paddingTop: Spacing.xl,
  },
});
