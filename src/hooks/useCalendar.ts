import { useCallback } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ZENFLO_CALENDAR_TITLE = 'Zenflo';
const CALENDAR_PREF_KEY = 'zenflo_calendar_provider';

export type CalendarProvider = 'apple' | 'google' | 'both' | 'none';

export function useCalendar() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  }, []);

  const getCalendarPreference = useCallback(async (): Promise<CalendarProvider> => {
    const pref = await AsyncStorage.getItem(CALENDAR_PREF_KEY);
    return (pref as CalendarProvider) || 'none';
  }, []);

  const setCalendarPreference = useCallback(async (pref: CalendarProvider): Promise<void> => {
    await AsyncStorage.setItem(CALENDAR_PREF_KEY, pref);
  }, []);

  const getFilteredCalendars = useCallback(async (): Promise<Calendar.Calendar[]> => {
    const pref = await getCalendarPreference();
    if (pref === 'none') return [];

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    if (pref === 'both') return calendars;

    return calendars.filter((cal) => {
      const sourceName = cal.source?.name?.toLowerCase() ?? '';
      const sourceType = cal.source?.type?.toLowerCase() ?? '';

      if (pref === 'apple') {
        return (
          sourceName.includes('icloud') ||
          sourceType.includes('caldav') ||
          sourceType.includes('local') ||
          cal.source?.isLocalAccount === true
        );
      }

      if (pref === 'google') {
        return sourceName.includes('google') || sourceType.includes('com.google');
      }

      return true;
    });
  }, [getCalendarPreference]);

  const getOrCreateZenfloCalendar = useCallback(async (): Promise<string> => {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const existing = calendars.find(c => c.title === ZENFLO_CALENDAR_TITLE);
    if (existing) return existing.id;

    // Pick source based on user preference
    const pref = await getCalendarPreference();
    let calendarSource: Calendar.Source | undefined;

    if (Platform.OS === 'ios') {
      if (pref === 'google') {
        calendarSource = calendars.find(c => c.source?.name?.toLowerCase().includes('google'))?.source;
      }
      if (!calendarSource) {
        calendarSource =
          calendars.find(c => c.source?.name === 'iCloud')?.source ??
          calendars.find(c => c.source?.isLocalAccount)?.source ??
          calendars[0]?.source;
      }
    } else {
      calendarSource = { isLocalAccount: true, name: ZENFLO_CALENDAR_TITLE, type: Calendar.CalendarType.LOCAL as string } as Calendar.Source;
    }

    if (!calendarSource) {
      throw new Error('No calendar source available');
    }

    const newCalendarId = await Calendar.createCalendarAsync({
      title: ZENFLO_CALENDAR_TITLE,
      color: '#E8853D',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: calendarSource.id,
      source: calendarSource,
      name: ZENFLO_CALENDAR_TITLE,
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  }, [getCalendarPreference]);

  const createCalendarEvent = useCallback(async (params: {
    title: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
  }): Promise<string> => {
    const calendarId = await getOrCreateZenfloCalendar();
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: params.title,
      startDate: params.startDate,
      endDate: params.endDate,
      notes: params.notes,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return eventId;
  }, [getOrCreateZenfloCalendar]);

  const updateCalendarEvent = useCallback(async (eventId: string, params: {
    title?: string;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
  }): Promise<void> => {
    await Calendar.updateEventAsync(eventId, {
      ...(params.title && { title: params.title }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.notes && { notes: params.notes }),
    });
  }, []);

  const deleteCalendarEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      await Calendar.deleteEventAsync(eventId);
    } catch {
      // Event may already be deleted
    }
  }, []);

  const getEventsForDate = useCallback(async (date: Date): Promise<Calendar.Event[]> => {
    const pref = await getCalendarPreference();
    if (pref === 'none') return [];

    const hasPermission = await requestPermissions();
    if (!hasPermission) return [];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const filteredCalendars = await getFilteredCalendars();
    const calendarIds = filteredCalendars.map(c => c.id);

    if (calendarIds.length === 0) return [];

    const events = await Calendar.getEventsAsync(calendarIds, startOfDay, endOfDay);
    return events;
  }, [requestPermissions, getCalendarPreference, getFilteredCalendars]);

  const importEventsForDate = useCallback(async (date: Date): Promise<Calendar.Event[]> => {
    return getEventsForDate(date);
  }, [getEventsForDate]);

  const exportTaskToCalendar = useCallback(async (task: {
    title: string;
    scheduledStart: string;
    scheduledEnd: string;
    notes?: string;
  }): Promise<string> => {
    const pref = await getCalendarPreference();
    if (pref === 'none') throw new Error('Calendar sync is disabled');

    return createCalendarEvent({
      title: task.title,
      startDate: new Date(task.scheduledStart),
      endDate: new Date(task.scheduledEnd),
      notes: task.notes,
    });
  }, [getCalendarPreference, createCalendarEvent]);

  return {
    requestPermissions,
    getOrCreateZenfloCalendar,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getEventsForDate,
    getCalendarPreference,
    setCalendarPreference,
    getFilteredCalendars,
    importEventsForDate,
    exportTaskToCalendar,
  };
}
