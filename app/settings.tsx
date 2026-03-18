import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
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
import { getDatabase } from '@/db/database';
import { getUserStats, getUnlockedBadges, getXPEvents } from '@/db/xp';
import { getAllGoals } from '@/db/goals';
import { getAllHabits } from '@/db/habits';
import { getLevelTier, xpProgressInCurrentLevel } from '@/constants/levels';
import { BADGES } from '@/constants/badges';
import { Badge as BadgeComponent } from '@/components/ui/Badge';
import { formatDate } from '@/utils/dates';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarProvider } from '@/hooks/useCalendar';

export default function SettingsScreen() {
  const stats = useAppStore((s) => s.stats);
  const setStats = useAppStore((s) => s.setStats);
  const { level, totalXP, progress, tier } = useXP();
  const { getSettings, toggleNotification, NOTIFICATION_KEYS } = useNotifications();
  const { habits } = useHabits();
  const { getCalendarPreference, setCalendarPreference } = useCalendar();
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

      // Store in AsyncStorage and share as text
      await AsyncStorage.setItem('zenflo_export', jsonString);
      Alert.alert('Export ready', 'Data has been prepared. Copy from AsyncStorage or use a file manager to access it.');
    } catch (error) {
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile */}
        <Card style={styles.profileCard}>
          <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
          <Text style={styles.profileLevel}>Level {level}</Text>
          <XPBar currentXP={progress.current} totalXP={progress.required} level={level} />
          <Text style={styles.totalXP}>{totalXP} total XP</Text>
          {stats?.lastActiveDate && (
            <Text style={styles.memberSince}>Member since {formatDate(stats.lastActiveDate)}</Text>
          )}
        </Card>

        {/* Calendar Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar Integration</Text>
          <Card style={{ gap: Spacing.md }}>
            <Text style={styles.calendarExplain}>
              Choose which calendar provider to sync with. Events from selected providers will appear in your timeline.
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
                  style={[
                    styles.calendarOption,
                    isActive && styles.calendarOptionActive,
                  ]}
                >
                  <Ionicons name={opt.icon} size={20} color={isActive ? Colors.accent : Colors.text.tertiary} />
                  <Text style={[styles.calendarOptionLabel, isActive && { color: Colors.accent }]}>{opt.label}</Text>
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

        {/* Streak freeze */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Freeze</Text>
          <Card>
            <Text style={styles.freezeExplain}>
              Freeze tokens protect your streak for one missed day. Earn them every 14 consecutive days. Max 2 per habit.
            </Text>
            {habits.map(h => (
              <View key={h.id} style={styles.freezeRow}>
                <Text style={styles.freezeHabit} numberOfLines={1}>{h.title}</Text>
                <Text style={styles.freezeCount}>{h.freezeTokens}/2 tokens</Text>
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
          <Text style={styles.sectionTitle}>About</Text>
          <Card>
            <Text style={styles.aboutText}>Zenflo v1.0.0</Text>
            <Text style={styles.aboutSubtext}>Zenflo is and will always be free.</Text>
          </Card>
        </View>

        {/* Accountability partner stub */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.comingSoon}>Accountability partner — coming soon.</Text>
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
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text.primary },
  profileCard: { alignItems: 'center', gap: Spacing.sm },
  tierName: { fontSize: Typography['2xl'], fontWeight: Typography.bold },
  profileLevel: { fontSize: Typography.sm, color: Colors.text.secondary },
  totalXP: { fontSize: Typography.sm, color: Colors.xp, fontWeight: Typography.semibold },
  memberSince: { fontSize: Typography.xs, color: Colors.text.tertiary },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text.primary },
  freezeExplain: { fontSize: Typography.sm, color: Colors.text.secondary, marginBottom: Spacing.md },
  freezeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  freezeHabit: { fontSize: Typography.base, color: Colors.text.primary, flex: 1 },
  freezeCount: { fontSize: Typography.sm, color: Colors.streakFrozen },
  badgeGrid: { gap: Spacing.sm },
  aboutText: { fontSize: Typography.base, color: Colors.text.primary },
  aboutSubtext: { fontSize: Typography.sm, color: Colors.text.secondary, marginTop: Spacing.xs },
  comingSoon: { fontSize: Typography.base, color: Colors.text.tertiary, textAlign: 'center' },
  calendarExplain: { fontSize: Typography.sm, color: Colors.text.secondary },
  calendarOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.background.tertiary, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'transparent' },
  calendarOptionActive: { borderColor: Colors.accent, borderWidth: 2 },
  calendarOptionLabel: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.text.primary, flex: 1 },
});
