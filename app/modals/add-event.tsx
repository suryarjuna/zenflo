import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing, Radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { SmartDatePicker } from '@/components/ui/SmartDatePicker';
import { useTasks } from '@/hooks/useTasks';
import { useCalendar } from '@/hooks/useCalendar';

const EVENT_TYPES = [
  { label: 'Wedding', value: 'wedding' },
  { label: 'Engagement', value: 'engagement' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Travel', value: 'travel' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Custom', value: 'custom' },
];

export default function AddEventModal() {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('custom');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const { add } = useTasks();
  const { requestPermissions, createCalendarEvent } = useCalendar();

  const handleSave = async () => {
    if (!title.trim() || !date) return;
    setLoading(true);
    try {
      const hasPermission = await requestPermissions();

      const startDate = new Date(`${date}T${startTime}:00`);
      const endDate = new Date(`${date}T${endTime}:00`);

      let calendarEventId: string | undefined;
      if (hasPermission) {
        calendarEventId = await createCalendarEvent({
          title: title.trim(),
          startDate,
          endDate,
          notes: `Zenflo event: ${eventType}`,
        });
      }

      await add({
        title: title.trim(),
        dueDate: date,
        priority: 'medium',
        isRecurring: false,
        isEvent: true,
        eventType,
        scheduledStart: startDate.toISOString(),
        scheduledEnd: endDate.toISOString(),
        calendarEventId,
      });

      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>New Event</Text>
          <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ gap: Spacing.xl }}>
          <View style={styles.field}>
            <Text style={styles.label}>Event name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah's Wedding"
              placeholderTextColor={Colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              accessibilityLabel="Event name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {EVENT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, eventType === t.value && styles.chipActive]}
                  onPress={() => setEventType(t.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={t.label}
                  accessibilityState={{ selected: eventType === t.value }}
                >
                  <Text style={[styles.chipText, eventType === t.value && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <SmartDatePicker
              value={date}
              onChange={setDate}
              label="Date & Time"
              showTimePicker={true}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </View>

          <Text style={styles.hint}>This event will be added to your Apple Calendar.</Text>
        </ScrollView>

        <View style={styles.bottom}>
          <Button
            label="Create Event"
            onPress={handleSave}
            disabled={!title.trim() || !date}
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
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.background.tertiary },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: Typography.sm, color: Colors.text.secondary },
  chipTextActive: { color: Colors.text.primary, fontWeight: Typography.semibold },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
  hint: { fontSize: Typography.sm, color: Colors.text.tertiary, textAlign: 'center' },
  bottom: { paddingTop: Spacing.lg },
});
