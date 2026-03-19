import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing, Radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { SmartDatePicker } from '@/components/ui/SmartDatePicker';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useCalendar } from '@/hooks/useCalendar';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { getAllCategories, createCategory } from '@/db/categories';
import { Ionicons } from '@expo/vector-icons';
import type { TaskPriority, Task, Category } from '@/types';

const getPriorities = (Colors: ThemeColors): { label: string; value: TaskPriority; color: string }[] => [
  { label: 'High', value: 'high', color: Colors.danger },
  { label: 'Medium', value: 'medium', color: Colors.warning },
  { label: 'Low', value: 'low', color: Colors.text.tertiary },
];

export default function AddTaskModal() {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const PRIORITIES = getPriorities(Colors);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [goalId, setGoalId] = useState<string | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<Task['recurringInterval']>('daily');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { add } = useTasks();
  const { goals, refresh: refreshGoals } = useGoals();
  const { requestPermissions, createCalendarEvent } = useCalendar();

  useEffect(() => {
    refreshGoals();
    getAllCategories().then(setCategories);
  }, []);

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      let calendarEventId: string | undefined;
      let scheduledStart: string | undefined;
      let scheduledEnd: string | undefined;

      // Create calendar event if time block is set
      if (scheduledDate && startTime && endTime) {
        const startDate = new Date(`${scheduledDate}T${startTime}:00`);
        const endDate = new Date(`${scheduledDate}T${endTime}:00`);
        scheduledStart = startDate.toISOString();
        scheduledEnd = endDate.toISOString();

        const hasPermission = await requestPermissions();
        if (hasPermission) {
          calendarEventId = await createCalendarEvent({
            title: title.trim(),
            startDate,
            endDate,
            notes: `Zenflo task: ${priority} priority`,
          });
        }
      }

      await add({
        title: title.trim(),
        priority,
        dueDate: dueDate || undefined,
        goalId,
        categoryId,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
        scheduledStart,
        scheduledEnd,
        calendarEventId,
      });
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
          <Text style={styles.title}>New Task</Text>
          <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ gap: Spacing.xl }}>
          <View style={styles.field}>
            <Text style={styles.label}>Task</Text>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor={Colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              accessibilityLabel="Task title"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, priority === p.value && { backgroundColor: p.color + '25', borderColor: p.color, borderWidth: 1 }]}
                  onPress={() => setPriority(p.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={p.label}
                  accessibilityState={{ selected: priority === p.value }}
                >
                  <View style={[styles.dot, { backgroundColor: p.color }]} />
                  <Text style={[styles.chipText, priority === p.value && { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <SmartDatePicker
              value={dueDate}
              onChange={setDueDate}
              label="Due date"
            />
          </View>

          <View style={styles.field}>
            <SmartDatePicker
              value={scheduledDate}
              onChange={setScheduledDate}
              label="Schedule time block"
              showTimePicker={true}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
              onCreateCategory={async (data) => {
                const cat = await createCategory(data);
                setCategories(prev => [...prev, cat]);
                setCategoryId(cat.id);
              }}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Recurring</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !isRecurring && styles.chipActive]}
                onPress={() => setIsRecurring(false)}
                accessibilityRole="radio"
                accessibilityLabel="One-time"
              >
                <Text style={[styles.chipText, !isRecurring && styles.chipTextActive]}>One-time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, isRecurring && styles.chipActive]}
                onPress={() => setIsRecurring(true)}
                accessibilityRole="radio"
                accessibilityLabel="Recurring"
              >
                <Text style={[styles.chipText, isRecurring && styles.chipTextActive]}>Recurring</Text>
              </TouchableOpacity>
            </View>
            {isRecurring && (
              <View style={[styles.chipRow, { marginTop: Spacing.sm }]}>
                {(['daily', 'weekly', 'monthly'] as const).map(interval => (
                  <TouchableOpacity
                    key={interval}
                    style={[styles.chip, recurringInterval === interval && styles.chipActive]}
                    onPress={() => setRecurringInterval(interval)}
                    accessibilityRole="radio"
                    accessibilityLabel={interval}
                    accessibilityState={{ selected: recurringInterval === interval }}
                  >
                    <Text style={[styles.chipText, recurringInterval === interval && styles.chipTextActive]}>
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
                  >
                    <Text style={[styles.chipText, goalId === g.id && styles.chipTextActive]} numberOfLines={1}>{g.title}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.chip, { borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed' }]}
                  onPress={() => {
                    router.push('/modals/add-goal');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Create new goal"
                >
                  <Ionicons name="add-circle-outline" size={16} color={Colors.accent} />
                  <Text style={[styles.chipText, { color: Colors.accent }]}>New Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottom}>
          <Button
            label="Create Task"
            onPress={handleSave}
            disabled={!title.trim()}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  container: { flex: 1, padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text.primary },
  form: { flex: 1 },
  field: { gap: Spacing.sm },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text.secondary },
  input: { fontSize: Typography.base, color: Colors.text.primary, backgroundColor: Colors.background.secondary, borderRadius: 10, padding: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.background.tertiary },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: Typography.sm, color: Colors.text.secondary },
  chipTextActive: { color: Colors.text.primary, fontWeight: Typography.semibold },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bottom: { paddingTop: Spacing.lg },
});
