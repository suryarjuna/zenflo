import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOTIFICATION_KEYS = {
  morningEnabled: 'zenflo_notif_morning',
  streakEnabled: 'zenflo_notif_streak',
  flightLogEnabled: 'zenflo_notif_flight_log',
  morningTime: 'zenflo_notif_morning_time',
};

export function useNotifications() {
  const requestPermissions = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, []);

  const scheduleAll = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const morningEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.morningEnabled);
    const streakEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.streakEnabled);
    const flightLogEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.flightLogEnabled);

    // Morning ritual - daily 8:00am
    if (morningEnabled !== 'false') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good morning',
          body: 'Time to build your flow. Your habits are waiting.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 8,
          minute: 0,
        },
      });
    }

    // Streak at risk - daily 9:00pm
    if (streakEnabled !== 'false') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Streak at risk',
          body: "You have incomplete habits today. Don't break the chain!",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
    }

    // Flight Log ready - every Sunday 9:00am
    if (flightLogEnabled !== 'false') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Flight Log ready',
          body: 'Your weekly review is waiting. Seal the log.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday
          hour: 9,
          minute: 0,
        },
      });
    }
  }, []);

  const toggleNotification = useCallback(async (key: string, enabled: boolean) => {
    await AsyncStorage.setItem(key, enabled ? 'true' : 'false');
    await scheduleAll();
  }, [scheduleAll]);

  const getSettings = useCallback(async () => {
    const morning = await AsyncStorage.getItem(NOTIFICATION_KEYS.morningEnabled);
    const streak = await AsyncStorage.getItem(NOTIFICATION_KEYS.streakEnabled);
    const flightLog = await AsyncStorage.getItem(NOTIFICATION_KEYS.flightLogEnabled);
    return {
      morningEnabled: morning !== 'false',
      streakEnabled: streak !== 'false',
      flightLogEnabled: flightLog !== 'false',
    };
  }, []);

  return {
    requestPermissions,
    scheduleAll,
    toggleNotification,
    getSettings,
    NOTIFICATION_KEYS,
  };
}
