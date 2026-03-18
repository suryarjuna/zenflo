import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { XPBar } from '@/components/ui/XPBar';
import { useAppStore } from '@/store/useAppStore';
import { useXP } from '@/hooks/useXP';
import { useNotifications } from '@/hooks/useNotifications';
import { useHabits } from '@/hooks/useHabits';
import { useCalendar } from '@/hooks/useCalendar';
import { getDatabase } from '@/db/database';
import { getUserStats, setUserName, getUnlockedBadges, getXPEvents } from '@/db/xp';
import { getAllGoals } from '@/db/goals';
import { getAllHabits } from '@/db/habits';
import { getLevelTier } from '@/constants/levels';
import { BADGES } from '@/constants/badges';
import { Badge as BadgeComponent } from '@/components/ui/Badge';
import { formatDate } from '@/utils/dates';
import type { CalendarProvider } from '@/hooks/useCalendar';

export default function ProfileScreen() {
  const stats = useAppStore((s) => s.stats);
  const setStats = useAppStore((s) => s.setStats);
  const { level, totalXP, progress, tier } = useXP();
  const { getSettings, toggleNotification, NOTIFICATION_KEYS } = useNotifications();
  const { habits } = useHabits();
  const { getCalendarPreference, setCalendarPreference } = useCalendar();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(stats?.userName ?? '');
  const [calendarProvider, setCalendarProviderState] = useState<CalendarProvider>('none');
  const [notifSettings, setNotifSettings] = useState({
    morningEnabled: true,
    streakEnabled: true,
    flightLogEnabled: true,
  });
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSettings().then(setNotifSettings);
    getUnlockedBadges().then(badges => setUnlockedBadges(new Set(badges.map(b => b.id))));
    getCalendarPreference().then(setCalendarProviderState);
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
      'This will permanently delete all your goals, habits, tasks, sessions, and progress. This cannot be undone.',
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

  const initials = (stats?.userName ?? 'Z')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Profile</Text>

        {/* Avatar + Name + Level */}
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
              <Ionicons name="pencil" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}

          <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
          <Text style={styles.profileLevel}>Level {level}</Text>
          <XPBar currentXP={progress.current} totalXP={progress.required} level={level} />
          <Text style={styles.totalXP}>{totalXP.toLocaleString()} total XP</Text>
          {stats?.lastActiveDate && (
            <Text style={styles.memberSince}>Member since {formatDate(stats.lastActiveDate)}</Text>
          )}
        </Card>

        {/* Calendar Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar Integration</Text>
          <Card style={{ gap: Spacing.md }}>
            <Text style={styles.explainText}>
              Choose which calendar to sync with.
            </Text>
            {([
              { value: 'apple' as CalendarProvider, label: 'Apple Calendar', icon: 'logo-apple' as const },
              { value: 'google' as CalendarProvider, label: 'Google Calendar', icon: 'logo-google' as const },
              { value: 'both' as CalendarProvider, label: 'Both', icon: 'sync-outline' as const },
              { value: 'none' as CalendarProvider, label: 'None', icon: 'close-circle-outline' as const },
            ]).map(opt => {
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
                  style={[styles.optionRow, isActive && styles.optionRowActive]}
                >
                  <Ionicons name={opt.icon} size={20} color={isActive ? Colors.accent : Colors.text.tertiary} />
                  <Text style={[styles.optionLabel, isActive && { color: Colors.accent }]}>{opt.label}</Text>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card>
            <NotifRow
              label="Morning ritual (8:00 AM)"
              enabled={notifSettings.morningEnabled}
              onToggle={() => toggleNotif(NOTIFICATION_KEYS.morningEnabled, notifSettings.morningEnabled)}
            />
            <NotifRow
              label="Streak at risk (9:00 PM)"
              enabled={notifSettings.streakEnabled}
              onToggle={() => toggleNotif(NOTIFICATION_KEYS.streakEnabled, notifSettings.streakEnabled)}
            />
            <NotifRow
              label="Flight Log ready (Sunday 9 AM)"
              enabled={notifSettings.flightLogEnabled}
              onToggle={() => toggleNotif(NOTIFICATION_KEYS.flightLogEnabled, notifSettings.flightLogEnabled)}
            />
          </Card>
        </View>

        {/* Streak Freeze */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Freeze</Text>
          <Card>
            <Text style={styles.explainText}>
              Freeze tokens protect your streak for one missed day. Earn them every 14 consecutive days. Max 2 per habit.
            </Text>
            {habits.map(h => (
              <View key={h.id} style={styles.freezeRow}>
                <Text style={styles.freezeHabit} numberOfLines={1}>{h.title}</Text>
                <Text style={styles.freezeCount}>{h.freezeTokens}/2</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {BADGES.map(badge => (
              <BadgeComponent
                key={badge.id}
                icon={badge.icon}
                name={badge.name}
                description={badge.description}
                unlocked={unlockedBadges.has(badge.id)}
              />
            ))}
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Card style={{ gap: Spacing.md }}>
            <Button variant="secondary" label="Export as JSON" onPress={handleExport} />
            <Button variant="danger" label="Clear all data" onPress={handleClearData} />
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.aboutText}>Zenflo v1.0.0</Text>
            <Text style={styles.aboutSubtext}>Zenflo is and will always be free.</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NotifRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={notifStyles.row}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: enabled }}
    >
      <Text style={notifStyles.label}>{label}</Text>
      <Ionicons
        name={enabled ? 'toggle' : 'toggle-outline'}
        size={36}
        color={enabled ? Colors.accent : Colors.text.tertiary}
      />
    </TouchableOpacity>
  );
}

const notifStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  label: { fontSize: Typography.base, color: Colors.text.primary, flex: 1 },
});

const styles = StyleSheet.create({
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
  // Profile card
  profileCard: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  avatarText: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
  profileLevel: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  totalXP: {
    fontSize: Typography.sm,
    color: Colors.xp,
    fontWeight: Typography.semibold,
  },
  memberSince: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  // Sections
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  explainText: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  // Options (calendar, etc.)
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowActive: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  optionLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.text.primary,
    flex: 1,
  },
  // Freeze
  freezeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  freezeHabit: {
    fontSize: Typography.base,
    color: Colors.text.primary,
    flex: 1,
  },
  freezeCount: {
    fontSize: Typography.sm,
    color: Colors.streakFrozen,
    fontWeight: Typography.medium,
  },
  // Badges
  badgeGrid: {
    gap: Spacing.sm,
  },
  // About
  aboutText: {
    fontSize: Typography.base,
    color: Colors.text.primary,
  },
  aboutSubtext: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
});
