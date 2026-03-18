import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useCalendar } from '../../hooks/useCalendar';
import { getEventsForDate as getAppEvents } from '../../db/tasks';
import { getTasksForToday } from '../../db/tasks';
import { format, parseISO } from 'date-fns';
import type { Task } from '../../types';

interface DayScheduleProps {
  date: Date;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'event' | 'calendar';
  color: string;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

export function DaySchedule({ date }: DayScheduleProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const { getEventsForDate } = useCalendar();

  useEffect(() => {
    loadSchedule();
  }, [date]);

  const loadSchedule = async () => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const allItems: ScheduleItem[] = [];

    // App events/tasks with scheduled times
    try {
      const appEvents = await getAppEvents(dateStr);
      for (const event of appEvents) {
        if (event.scheduledStart && event.scheduledEnd) {
          allItems.push({
            id: event.id,
            title: event.title,
            startTime: format(parseISO(event.scheduledStart), 'HH:mm'),
            endTime: format(parseISO(event.scheduledEnd), 'HH:mm'),
            type: event.isEvent ? 'event' : 'task',
            color: event.isEvent ? Colors.pilot.primary : Colors.accent,
          });
        }
      }
    } catch {}

    // Apple Calendar events
    try {
      const calendarEvents = await getEventsForDate(date);
      for (const event of calendarEvents) {
        if (event.startDate && event.endDate) {
          allItems.push({
            id: event.id,
            title: event.title,
            startTime: format(new Date(event.startDate), 'HH:mm'),
            endTime: format(new Date(event.endDate), 'HH:mm'),
            type: 'calendar',
            color: Colors.text.tertiary,
          });
        }
      }
    } catch {}

    // Sort by start time
    allItems.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setItems(allItems);
  };

  const getItemsForHour = (hour: number) => {
    const hourStr = hour.toString().padStart(2, '0');
    return items.filter(item => item.startTime.startsWith(hourStr));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {HOURS.map(hour => {
        const hourItems = getItemsForHour(hour);
        const timeLabel = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

        return (
          <View key={hour} style={styles.hourRow}>
            <Text style={styles.hourLabel}>{timeLabel}</Text>
            <View style={styles.hourContent}>
              <View style={styles.hourLine} />
              {hourItems.map(item => (
                <View key={item.id} style={[styles.eventBlock, { backgroundColor: item.color + '20', borderLeftColor: item.color }]}>
                  <Text style={[styles.eventTitle, { color: item.color }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.eventTime}>{item.startTime} - {item.endTime}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 60,
    paddingVertical: Spacing.xs,
  },
  hourLabel: {
    width: 55,
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
    textAlign: 'right',
    paddingRight: Spacing.sm,
    paddingTop: 2,
  },
  hourContent: {
    flex: 1,
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border.subtle,
  },
  eventBlock: {
    borderLeftWidth: 3,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
    marginRight: Spacing.sm,
  },
  eventTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  eventTime: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
});
