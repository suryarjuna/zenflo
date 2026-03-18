import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { format, addDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface SmartDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  showTimePicker?: boolean;
  startTime?: string;
  endTime?: string;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
}

export function SmartDatePicker({
  value,
  onChange,
  label = 'When?',
  showTimePicker = false,
  startTime = '',
  endTime = '',
  onStartTimeChange,
  onEndTimeChange,
}: SmartDatePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const quickOptions = [
    { label: 'Today', value: today, icon: 'today-outline' as const },
    { label: 'Tomorrow', value: tomorrow, icon: 'calendar-outline' as const },
  ];

  const isQuickOption = value === today || value === tomorrow;
  const isCustom = !!value && !isQuickOption;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.optionsRow}>
        {quickOptions.map(opt => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.quickChip, value === opt.value && styles.quickChipActive]}
            onPress={() => {
              onChange(opt.value);
              setShowCustom(false);
            }}
            accessibilityRole="radio"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: value === opt.value }}
          >
            <Ionicons
              name={opt.icon}
              size={16}
              color={value === opt.value ? Colors.text.primary : Colors.text.secondary}
            />
            <Text style={[styles.quickText, value === opt.value && styles.quickTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.quickChip, (showCustom || isCustom) && styles.quickChipActive]}
          onPress={() => setShowCustom(true)}
          accessibilityRole="radio"
          accessibilityLabel="Pick a date"
          accessibilityState={{ selected: showCustom || isCustom }}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={(showCustom || isCustom) ? Colors.text.primary : Colors.text.secondary}
          />
          <Text style={[styles.quickText, (showCustom || isCustom) && styles.quickTextActive]}>
            {isCustom ? format(new Date(value + 'T00:00:00'), 'MMM d') : 'Pick date'}
          </Text>
        </TouchableOpacity>
      </View>

      {showCustom && (
        <TextInput
          style={styles.dateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.text.tertiary}
          value={value}
          onChangeText={(text) => {
            onChange(text);
          }}
          keyboardType="numbers-and-punctuation"
          autoFocus
          accessibilityLabel="Custom date"
        />
      )}

      {showTimePicker && value && (
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>Start</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="HH:MM"
              placeholderTextColor={Colors.text.tertiary}
              value={startTime}
              onChangeText={onStartTimeChange}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="Start time"
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>End</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="HH:MM"
              placeholderTextColor={Colors.text.tertiary}
              value={endTime}
              onChangeText={onEndTimeChange}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="End time"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.background.tertiary,
  },
  quickChipActive: {
    backgroundColor: Colors.accent,
  },
  quickText: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  quickTextActive: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  dateInput: {
    fontSize: Typography.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    padding: Spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeField: {
    flex: 1,
    gap: Spacing.xs,
  },
  timeLabel: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  timeInput: {
    fontSize: Typography.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    padding: Spacing.md,
  },
});
