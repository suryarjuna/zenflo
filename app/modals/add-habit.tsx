import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import type { HabitFrequency, XPWeight } from '@/types';

const FREQUENCIES: { label: string; value: HabitFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays', value: 'weekdays' },
];

const WEIGHTS: { value: XPWeight; label: string; xp: string }[] = [
  { value: 1, label: 'Standard', xp: '10 XP' },
  { value: 2, label: 'Important', xp: '20 XP' },
  { value: 3, label: 'Critical', xp: '30 XP' },
];

export default function AddHabitModal() {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [xpWeight, setXpWeight] = useState<XPWeight>(1);
  const [goalId, setGoalId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const { add } = useHabits();
  const { goals, refresh: refreshGoals } = useGoals();

  useEffect(() => { refreshGoals(); }, []);

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await add({ title: title.trim(), frequency, xpWeight, goalId });
      router.back();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>New Habit</Text>
          <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ gap: Spacing.xl }}>
          <View style={styles.field}>
            <Text style={styles.label}>Habit name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Meditate 10 minutes"
              placeholderTextColor={Colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              accessibilityLabel="Habit name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.chip, frequency === f.value && styles.chipActive]}
                  onPress={() => setFrequency(f.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={f.label}
                  accessibilityState={{ selected: frequency === f.value }}
                >
                  <Text style={[styles.chipText, frequency === f.value && styles.chipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>XP Weight</Text>
            <View style={styles.chipRow}>
              {WEIGHTS.map(w => (
                <TouchableOpacity
                  key={w.value}
                  style={[styles.chip, xpWeight === w.value && styles.chipActive]}
                  onPress={() => setXpWeight(w.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${w.label}: ${w.xp}`}
                  accessibilityState={{ selected: xpWeight === w.value }}
                >
                  <Text style={[styles.chipText, xpWeight === w.value && styles.chipTextActive]}>{w.label}</Text>
                  <Text style={[styles.chipSubText, xpWeight === w.value && styles.chipTextActive]}>{w.xp}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {goals.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Link to goal (optional)</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !goalId && styles.chipActive]}
                  onPress={() => setGoalId(undefined)}
                  accessibilityRole="radio"
                  accessibilityLabel="No goal"
                >
                  <Text style={[styles.chipText, !goalId && styles.chipTextActive]}>None</Text>
                </TouchableOpacity>
                {goals.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.chip, goalId === g.id && styles.chipActive]}
                    onPress={() => setGoalId(g.id)}
                    accessibilityRole="radio"
                    accessibilityLabel={g.title}
                    accessibilityState={{ selected: goalId === g.id }}
                  >
                    <Text style={[styles.chipText, goalId === g.id && styles.chipTextActive]} numberOfLines={1}>{g.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottom}>
          <Button
            label="Create Habit"
            onPress={handleSave}
            disabled={!title.trim()}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  container: { flex: 1, padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text.primary },
  form: { flex: 1 },
  field: { gap: Spacing.sm },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text.secondary },
  input: { fontSize: Typography.base, color: Colors.text.primary, backgroundColor: Colors.background.secondary, borderRadius: 10, padding: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.background.tertiary, alignItems: 'center' },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: Typography.sm, color: Colors.text.secondary },
  chipSubText: { fontSize: Typography.xs, color: Colors.text.tertiary },
  chipTextActive: { color: Colors.text.primary, fontWeight: Typography.semibold },
  bottom: { paddingTop: Spacing.lg },
});
