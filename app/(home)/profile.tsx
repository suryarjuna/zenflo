import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemeStore, Typography, Spacing, Radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { XPBar } from '@/components/ui/XPBar';
import { useAppStore } from '@/store/useAppStore';
import { useXP } from '@/hooks/useXP';
import { useNotifications } from '@/hooks/useNotifications';
import { useCalendar } from '@/hooks/useCalendar';
import { getDatabase } from '@/db/database';
import { getUserStats, setUserName } from '@/db/xp';
import { getLevelTier } from '@/constants/levels';
import { formatDate } from '@/utils/dates';
import type { CalendarProvider } from '@/hooks/useCalendar';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:00 ${period}`;
}

export default function ProfileScreen() {
  const Colors = useColors();
  const stats = useAppStore((s) => s.stats);
  const setStats = useAppStore((s) => s.setStats);
  const { level, totalXP, progress, tier } = useXP();
  const { getSettings, toggleNotification, setNotificationTime, getNotificationTimes, NOTIFICATION_KEYS } = useNotifications();
  const { getCalendarPreference, setCalendarPreference } = useCalendar();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(stats?.userName ?? '');
  const [calendarProvider, setCalendarProviderState] = useState<CalendarProvider>('none');
  const [notifSettings, setNotifSettings] = useState({
    morningEnabled: true,
    streakEnabled: true,
    flightLogEnabled: true,
  });
  const [notifTimes, setNotifTimes] = useState({
    morningHour: 8,
    streakHour: 21,
    flightLogHour: 9,
  });
  const [editingTime, setEditingTime] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setNotifSettings);
    getCalendarPreference().then(setCalendarProviderState);
    getNotificationTimes().then(setNotifTimes);
  }, []);

  useEffect(() => {
    if (stats?.userName) setName(stats.userName);
  }, [stats?.userName]);

  const saveName = async () => {
    if (name.trim()) {
      await setUserName(name.trim());
      const updated = await getUserStats();
      setStats(updated);
    }
    setEditingName(false);
  };

  const handleExport = async () => {
    try {
      const { getAllGoals } = await import('@/db/goals');
      const { getAllHabits } = await import('@/db/habits');
      const { getUnlockedBadges, getXPEvents } = await import('@/db/xp');
      const data = {
        stats: await getUserStats(),
        goals: await getAllGoals(),
        habits: await getAllHabits(),
        badges: await getUnlockedBadges(),
        xpEvents: await getXPEvents(1000),
        exportDate: new Date().toISOString(),
      };
      const jsonString = JSON.stringify(data, null, 2);
      await AsyncStorage.setItem('zenflo_export', jsonString);
      Alert.alert('Export ready', 'Data has been prepared.');
    } catch {
      Alert.alert('Export failed', 'Could not export data.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear all data?',
      'This will permanently delete all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Last chance. All data will be gone forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete everything',
                  style: 'destructive',
                  onPress: async () => {
                    const db = await getDatabase();
                    await db.execAsync(`
                      DELETE FROM xp_events;
                      DELETE FROM badges;
                      DELETE FROM flight_logs;
                      DELETE FROM focus_sessions;
                      DELETE FROM habit_completions;
                      DELETE FROM tasks;
                      DELETE FROM habits;
                      DELETE FROM goals;
                      UPDATE user_stats SET total_xp = 0, level = 1, overall_streak = 0,
                        longest_overall_streak = 0, total_focus_minutes = 0,
                        flight_logs_completed = 0, onboarding_complete = 0;
                    `);
                    await AsyncStorage.clear();
                    const newStats = await getUserStats();
                    setStats(newStats);
                    router.replace('/');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const toggleNotif = async (key: string, current: boolean) => {
    await toggleNotification(key, !current);
    const updated = await getSettings();
    setNotifSettings(updated);
  };

  const handleTimeChange = async (which: string, hour: number) => {
    await setNotificationTime(which, hour);
    const times = await getNotificationTimes();
    setNotifTimes(times);
    setEditingTime(null);
  };

  const initials = (stats?.userName ?? 'Z')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const calendarOptions: { value: CalendarProvider; label: string; icon: 'logo-apple' | 'logo-google' | 'sync-outline' | 'close-circle-outline' }[] = [
    { value: 'apple', label: 'Apple', icon: 'logo-apple' },
    { value: 'google', label: 'Google', icon: 'logo-google' },
    { value: 'both', label: 'Both', icon: 'sync-outline' },
    { value: 'none', label: 'None', icon: 'close-circle-outline' },
  ];

  const styles = createStyles(Colors);
  const nStyles = createNotifStyles(Colors);
  const tpStyles = createTimePickerStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Profile</Text>

        {/* Avatar + Name + Level — properly centered */}
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { borderColor: tier.color }]}>
            <Text style={[styles.avatarText, { color: tier.color }]}>{initials}</Text>
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
                placeholderTextColor={Colors.text.tertiary}
                placeholder="Your name"
                accessibilityLabel="Edit name"
              />
              <TouchableOpacity onPress={saveName} accessibilityLabel="Save name">
                <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingName(false); setName(stats?.userName ?? ''); }} accessibilityLabel="Cancel">
                <Ionicons name="close-circle" size={28} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)} style={styles.nameRow} accessibilityLabel="Edit name">
              <Text style={styles.userName}>{stats?.userName ?? 'Zenflo User'}</Text>
              <Ionicons name="pencil" size={14} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}

          <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
          <Text style={styles.profileLevel}>Level {level}</Text>
          <View style={styles.xpBarContainer}>
            <XPBar currentXP={progress.current} totalXP={progress.required} level={level} />
          </View>
          <Text style={styles.totalXP}>{totalXP.toLocaleString()} total XP</Text>
        </Card>

        {/* Theme toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.themeRow}>
            <ThemeOption
              icon="sunny"
              label="Light"
              active={useThemeStore.getState().mode === 'light'}
              onPress={async () => {
                useThemeStore.getState().setMode('light');
                await AsyncStorage.setItem('zenflo_theme', 'light');
              }}
            />
            <ThemeOption
              icon="moon"
              label="Dark"
              active={useThemeStore.getState().mode === 'dark'}
              onPress={async () => {
                useThemeStore.getState().setMode('dark');
                await AsyncStorage.setItem('zenflo_theme', 'dark');
              }}
            />
          </View>
        </View>

        {/* Achievements & Badges — navigates to detail screen */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/modals/achievements')}
          accessibilityRole="button"
          accessibilityLabel="View achievements and badges"
        >
          <View style={styles.menuLeft}>
            <Ionicons name="trophy-outline" size={20} color={Colors.accent} />
            <Text style={styles.menuLabel}>Achievements & Badges</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>

        {/* Calendar Integration — compact inline chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <View style={styles.calendarChips}>
            {calendarOptions.map(opt => {
              const isActive = calendarProvider === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={async () => {
                    await setCalendarPreference(opt.value);
                    setCalendarProviderState(opt.value);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: isActive }}
                  style={[styles.calendarChip, isActive && styles.calendarChipActive]}
                >
                  <Ionicons name={opt.icon} size={16} color={isActive ? Colors.accent : Colors.text.tertiary} />
                  <Text style={[styles.calendarChipText, isActive && { color: Colors.accent }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications — with time pickers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card style={styles.notifCard}>
            <NotifRow
              label="Morning ritual"
              enabled={notifSettings.morningEnabled}
              time={formatHour(notifTimes.morningHour)}
              onToggle={() => toggleNotif(NOTIFICATION_KEYS.morningEnabled, notifSettings.morningEnabled)}
              onTimePress={() => setEditingTime(editingTime === 'morning' ? null : 'morning')}
            />
            {editingTime === 'morning' && (
              <TimePicker
                selectedHour={notifTimes.morningHour}
                onSelect={(h) => handleTimeChange('morning', h)}
              />
            )}

            <NotifRow
              label="Streak at risk"
              enabled={notifSettings.streakEnabled}
              time={formatHour(notifTimes.streakHour)}
              onToggle={() => toggleNotif(NOTIFICATION_KEYS.streakEnabled, notifSettings.streakEnabled)}
              onTimePress={() => setEditingTime(editingTime === 'streak' ? null : 'streak')}
            />
            {editingTime === 'streak' && (
              <TimePicker
                selectedHour={notifTimes.streakHour}
                onSelect={(h) => handleTimeChange('streak', h)}
              />
            )}

            <NotifRow
              label="Flight Log (Sunday)"
              enabled={notifSettings.flightLogEnabled}
              time={formatHour(notifTimes.flightLogHour)}
              onToggle={() => toggleNotif(NOTIFICATION_KEYS.flightLogEnabled, notifSettings.flightLogEnabled)}
              onTimePress={() => setEditingTime(editingTime === 'flightLog' ? null : 'flightLog')}
            />
            {editingTime === 'flightLog' && (
              <TimePicker
                selectedHour={notifTimes.flightLogHour}
                onSelect={(h) => handleTimeChange('flightLog', h)}
              />
            )}
          </Card>
        </View>

        {/* Data — compact row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.dataRow}>
            <TouchableOpacity style={styles.dataButton} onPress={handleExport} accessibilityLabel="Export data">
              <Ionicons name="download-outline" size={18} color={Colors.text.secondary} />
              <Text style={styles.dataButtonText}>Export</Text>
            </TouchableOpacity>
            <View style={styles.dataDivider} />
            <TouchableOpacity style={styles.dataButton} onPress={handleClearData} accessibilityLabel="Clear all data">
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={[styles.dataButtonText, { color: Colors.danger }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerVersion}>Zenflo v1.0.0 — Free forever</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeOption({ icon, label, active, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: active ? Colors.accent + '15' : Colors.background.secondary,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? Colors.accent : 'transparent',
      }}
    >
      <Ionicons name={icon} size={18} color={active ? Colors.accent : Colors.text.tertiary} />
      <Text style={{
        fontSize: Typography.sm,
        fontWeight: active ? Typography.semibold : Typography.medium,
        color: active ? Colors.accent : Colors.text.secondary,
      }}>{label}</Text>
    </TouchableOpacity>
  );
}

function NotifRow({ label, enabled, time, onToggle, onTimePress }: {
  label: string;
  enabled: boolean;
  time: string;
  onToggle: () => void;
  onTimePress: () => void;
}) {
  const Colors = useColors();
  const notifStyles = createNotifStyles(Colors);
  return (
    <View style={notifStyles.row}>
      <TouchableOpacity
        onPress={onToggle}
        style={notifStyles.toggleArea}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: enabled }}
      >
        <Ionicons
          name={enabled ? 'notifications' : 'notifications-off-outline'}
          size={18}
          color={enabled ? Colors.accent : Colors.text.tertiary}
        />
        <Text style={[notifStyles.label, !enabled && { color: Colors.text.tertiary }]}>{label}</Text>
      </TouchableOpacity>
      {enabled && (
        <TouchableOpacity onPress={onTimePress} style={notifStyles.timePill} accessibilityLabel={`Change time for ${label}`}>
          <Text style={notifStyles.timeText}>{time}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.accent} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onToggle} accessibilityLabel={`Toggle ${label}`}>
        <Ionicons
          name={enabled ? 'toggle' : 'toggle-outline'}
          size={32}
          color={enabled ? Colors.accent : Colors.text.tertiary}
        />
      </TouchableOpacity>
    </View>
  );
}

function TimePicker({ selectedHour, onSelect }: { selectedHour: number; onSelect: (h: number) => void }) {
  const Colors = useColors();
  const timePickerStyles = createTimePickerStyles(Colors);
  const scrollRef = useRef<ScrollView>(null);
  const ROW_HEIGHT = 44;

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, selectedHour * ROW_HEIGHT - ROW_HEIGHT * 2),
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isCommonHour = (h: number) => h >= 6 && h <= 22;

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      style={timePickerStyles.scroll}
      contentContainerStyle={timePickerStyles.container}
    >
      {HOUR_OPTIONS.map(h => (
        <TouchableOpacity
          key={h}
          style={[
            timePickerStyles.row,
            h === selectedHour && timePickerStyles.rowActive,
          ]}
          onPress={() => onSelect(h)}
          accessibilityLabel={formatHour(h)}
        >
          <Text
            style={[
              timePickerStyles.rowText,
              h === selectedHour && timePickerStyles.rowTextActive,
              !isCommonHour(h) && h !== selectedHour && timePickerStyles.rowTextDim,
            ]}
          >
            {formatHour(h)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const createTimePickerStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: {
    height: 180,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.tertiary,
  },
  container: {
    paddingVertical: Spacing.xs,
  },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.xs,
  },
  rowActive: {
    backgroundColor: Colors.accent,
  },
  rowText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.text.primary,
  },
  rowTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.semibold,
  },
  rowTextDim: {
    color: Colors.text.tertiary,
  },
});

const createNotifStyles = (Colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  toggleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.text.primary,
    fontWeight: Typography.medium,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  timeText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: Typography.semibold,
  },
});

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  screenTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  // Profile card — centered layout
  profileCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  nameInput: {
    fontSize: Typography.lg,
    color: Colors.text.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
    paddingVertical: Spacing.xs,
    minWidth: 150,
    textAlign: 'center',
  },
  tierName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  profileLevel: {
    fontSize: Typography.xs,
    color: Colors.text.secondary,
  },
  xpBarContainer: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  totalXP: {
    fontSize: Typography.xs,
    color: Colors.xp,
    fontWeight: Typography.semibold,
    marginTop: Spacing.xs,
  },
  // Menu row (achievements)
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.text.primary,
  },
  // Sections
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Theme toggle
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  // Calendar — compact chips
  calendarChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  calendarChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  calendarChipActive: {
    borderColor: Colors.accent,
  },
  calendarChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.text.secondary,
  },
  // Notifications
  notifCard: {
    gap: Spacing.xs,
  },
  // Data — compact row
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dataButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  dataButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.text.secondary,
  },
  dataDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border.subtle,
  },
  // Footer
  footerVersion: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
