import { useCallback } from 'react';
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
  morningHour: 'zenflo_notif_morning_hour',
  streakHour: 'zenflo_notif_streak_hour',
  flightLogHour: 'zenflo_notif_flight_log_hour',
};

export function useNotifications() {
  const requestPermissions = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, []);

  const getNotificationTimes = useCallback(async () => {
    const [mh, sh, fh] = await Promise.all([
      AsyncStorage.getItem(NOTIFICATION_KEYS.morningHour),
      AsyncStorage.getItem(NOTIFICATION_KEYS.streakHour),
      AsyncStorage.getItem(NOTIFICATION_KEYS.flightLogHour),
    ]);
    return {
      morningHour: mh ? parseInt(mh, 10) : 8,
      streakHour: sh ? parseInt(sh, 10) : 21,
      flightLogHour: fh ? parseInt(fh, 10) : 9,
    };
  }, []);

  const scheduleAll = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const morningEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.morningEnabled);
    const streakEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.streakEnabled);
    const flightLogEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.flightLogEnabled);
    const times = await getNotificationTimes();

    if (morningEnabled !== 'false') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good morning',
          body: 'Time to build your flow. Your habits are waiting.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: times.morningHour,
          minute: 0,
        },
      });
    }

    if (streakEnabled !== 'false') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Streak at risk',
          body: "You have incomplete habits today. Don't break the chain!",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: times.streakHour,
          minute: 0,
        },
      });
    }

    if (flightLogEnabled !== 'false') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Flight Log ready',
          body: 'Your weekly review is waiting. Seal the log.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour: times.flightLogHour,
          minute: 0,
        },
      });
    }
  }, [getNotificationTimes]);

  const toggleNotification = useCallback(async (key: string, enabled: boolean) => {
    await AsyncStorage.setItem(key, enabled ? 'true' : 'false');
    await scheduleAll();
  }, [scheduleAll]);

  const setNotificationTime = useCallback(async (which: string, hour: number) => {
    const keyMap: Record<string, string> = {
      morning: NOTIFICATION_KEYS.morningHour,
      streak: NOTIFICATION_KEYS.streakHour,
      flightLog: NOTIFICATION_KEYS.flightLogHour,
    };
    const key = keyMap[which];
    if (key) {
      await AsyncStorage.setItem(key, String(hour));
      await scheduleAll();
    }
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
    setNotificationTime,
    getSettings,
    getNotificationTimes,
    NOTIFICATION_KEYS,
  };
}
