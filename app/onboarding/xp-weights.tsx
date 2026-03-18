import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressDots } from './welcome';
import type { XPWeight } from '@/types';

interface HabitWithWeight {
  title: string;
  frequency: string;
  xpWeight: XPWeight;
}

const WEIGHT_OPTIONS: { value: XPWeight; label: string; xp: number; color: string }[] = [
  { value: 1, label: 'Standard', xp: 10, color: Colors.text.tertiary },
  { value: 2, label: 'Important', xp: 20, color: Colors.warning },
  { value: 3, label: 'Critical', xp: 30, color: Colors.athlete.primary },
];

export default function XPWeightsScreen() {
  const [habits, setHabits] = useState<HabitWithWeight[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('zenflo_onboarding_habits').then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        setHabits(parsed.map((h: { title: string; frequency: string }) => ({
          ...h,
          xpWeight: 1 as XPWeight,
        })));
      }
    });
  }, []);

  const totalDailyXP = habits.reduce((sum, h) => sum + 10 * h.xpWeight, 0);

  const setWeight = (index: number, weight: XPWeight) => {
    setHabits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], xpWeight: weight };
      return updated;
    });
  };

  const handleNext = async () => {
    await AsyncStorage.setItem('zenflo_onboarding_habits', JSON.stringify(habits));
    router.push('/onboarding/first-session');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressDots current={3} total={5} />
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.heading}>Not all habits are equal.</Text>
          <Text style={styles.subtitle}>Tell Zenflo which ones matter most.</Text>

          <View style={styles.habitList}>
            {habits.map((habit, index) => (
              <Card key={index} style={styles.habitCard}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <View style={styles.weightOptions}>
                  {WEIGHT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.weightChip,
                        habit.xpWeight === option.value && { backgroundColor: option.color + '25', borderColor: option.color },
                      ]}
                      onPress={() => setWeight(index, option.value)}
                      accessibilityRole="radio"
                      accessibilityLabel={`${option.label}: ${option.xp} XP per day`}
                      accessibilityState={{ selected: habit.xpWeight === option.value }}
                    >
                      <Text style={[
                        styles.weightLabel,
                        habit.xpWeight === option.value && { color: option.color },
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.weightXP,
                        habit.xpWeight === option.value && { color: option.color },
                      ]}>
                        {option.value}x / {option.xp} XP
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            ))}
          </View>

          <Card style={styles.previewCard}>
            <Text style={styles.previewLabel}>Daily XP potential</Text>
            <Text style={styles.previewXP}>{totalDailyXP} XP</Text>
          </Card>
        </View>

        <View style={styles.bottom}>
          <Button label="Got it" onPress={handleNext} />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  top: {
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  heading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.md,
    color: Colors.text.secondary,
    marginTop: -Spacing.md,
  },
  habitList: {
    gap: Spacing.md,
  },
  habitCard: {
    gap: Spacing.md,
  },
  habitTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  weightOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  weightChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    gap: Spacing['2xs'],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  weightLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.text.secondary,
  },
  weightXP: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  previewCard: {
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
  },
  previewLabel: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  previewXP: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.xp,
  },
  bottom: {
    paddingTop: Spacing.xl,
  },
});
