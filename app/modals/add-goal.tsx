import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { SmartDatePicker } from '@/components/ui/SmartDatePicker';
import { useGoals } from '@/hooks/useGoals';
import type { Importance } from '@/types';

const IMPORTANCE_OPTIONS: { value: Importance; label: string; color: string }[] = [
  { value: 'high', label: 'Critical', color: Colors.danger },
  { value: 'medium', label: 'Important', color: Colors.warning },
  { value: 'low', label: 'Nice to have', color: Colors.text.tertiary },
];

export default function AddGoalModal() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [importance, setImportance] = useState<Importance>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { add, goals } = useGoals();

  const handleSave = async () => {
    if (!title.trim()) return;
    if (goals.length >= 5) {
      setError('Maximum 5 active goals allowed.');
      return;
    }
    setLoading(true);
    try {
      await add({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        importance,
      });
      router.back();
    } catch (e) {
      setError('Failed to create goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>New Goal</Text>
          <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to achieve?"
              placeholderTextColor={Colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              accessibilityLabel="Goal title"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Why does this matter?"
              placeholderTextColor={Colors.text.tertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              accessibilityLabel="Goal description"
            />
          </View>

          <View style={styles.field}>
            <SmartDatePicker
              value={targetDate}
              onChange={setTargetDate}
              label="Target date (optional)"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Importance</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {IMPORTANCE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: 'transparent' },
                    importance === opt.value && { backgroundColor: opt.color + '25', borderColor: opt.color },
                  ]}
                  onPress={() => setImportance(opt.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: importance === opt.value }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: opt.color }} />
                  <Text style={[{ fontSize: Typography.sm, color: Colors.text.secondary }, importance === opt.value && { color: opt.color }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.bottom}>
          <Button
            label="Create Goal"
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
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  form: {
    flex: 1,
    gap: Spacing.xl,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.text.secondary,
  },
  input: {
    fontSize: Typography.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    padding: Spacing.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: Typography.sm,
    color: Colors.danger,
  },
  bottom: {
    paddingTop: Spacing.lg,
  },
});
