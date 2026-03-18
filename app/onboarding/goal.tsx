import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from './welcome';
import type { Importance } from '@/types';

const IMPORTANCE_OPTIONS: { value: Importance; label: string; color: string }[] = [
  { value: 'high', label: 'Critical', color: Colors.danger },
  { value: 'medium', label: 'Important', color: Colors.warning },
  { value: 'low', label: 'Nice to have', color: Colors.text.tertiary },
];

export default function GoalScreen() {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [importance, setImportance] = useState<Importance>('medium');

  const handleNext = async () => {
    await AsyncStorage.setItem('zenflo_onboarding_goal', JSON.stringify({
      title: title.trim(),
      targetDate: targetDate || undefined,
      importance,
    }));
    router.push('/onboarding/habits');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressDots current={1} total={5} />
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.heading}>What's the one thing you're working toward?</Text>
          <Text style={styles.subtitle}>Start with what matters most right now.</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Run a marathon, Launch my app, Read 30 books"
            placeholderTextColor={Colors.text.tertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus
            accessibilityLabel="Goal title"
          />

          <View style={styles.importanceSection}>
            <Text style={styles.sectionLabel}>How important is this?</Text>
            <View style={styles.chipRow}>
              {IMPORTANCE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    importance === opt.value && { backgroundColor: opt.color + '25', borderColor: opt.color, borderWidth: 1 },
                  ]}
                  onPress={() => setImportance(opt.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: importance === opt.value }}
                >
                  <View style={[styles.dot, { backgroundColor: opt.color }]} />
                  <Text style={[styles.chipText, importance === opt.value && { color: opt.color }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.dateSection}>
            <Text style={styles.sectionLabel}>Target date (optional)</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.text.tertiary}
              value={targetDate}
              onChangeText={setTargetDate}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="Target date"
            />
          </View>
        </View>

        <View style={styles.bottom}>
          <Button
            label="Set this goal"
            onPress={handleNext}
            disabled={!title.trim()}
          />
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
    paddingTop: Spacing['2xl'],
    gap: Spacing.lg,
  },
  heading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text.primary,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: Typography.md,
    color: Colors.text.secondary,
  },
  input: {
    fontSize: Typography.lg,
    color: Colors.text.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  importanceSection: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateSection: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  dateInput: {
    fontSize: Typography.base,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingVertical: Spacing.sm,
  },
  bottom: {
    paddingTop: Spacing.xl,
  },
});
