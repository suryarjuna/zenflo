import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import { useAppStore } from '@/store/useAppStore';
import { getUnlockedBadges } from '@/db/xp';
import { BADGES } from '@/constants/badges';

const BADGE_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  first_session: 'body-outline',
  week_flame: 'flame',
  monk: 'moon',
  ironstreak: 'flash',
  first_goal: 'flag',
  pilot_certified: 'airplane',
  centurion: 'ribbon',
  xp_1000: 'trending-up',
  xp_10000: 'star',
  zenmaster: 'sparkles',
  habit_5: 'layers',
  focus_10h: 'timer',
};

export default function AchievementsScreen() {
  const Colors = useColors();
  const { habits } = useHabits();
  const stats = useAppStore((s) => s.stats);
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());

  useEffect(() => {
    getUnlockedBadges().then(badges => setUnlockedBadges(new Set(badges.map(b => b.id))));
  }, []);

  const unlockedCount = BADGES.filter(b => unlockedBadges.has(b.id)).length;

  const styles = createStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close" accessibilityRole="button">
          <Ionicons name="close" size={28} color={Colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}/{BADGES.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.longestOverallStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalFocusMinutes ?? 0}m</Text>
            <Text style={styles.statLabel}>Focus time</Text>
          </View>
        </View>

        {/* Badges grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {BADGES.map(badge => {
              const unlocked = unlockedBadges.has(badge.id);
              const iconName = BADGE_ICON_MAP[badge.id] ?? 'help-circle-outline';
              return (
                <View
                  key={badge.id}
                  style={[styles.badgeCard, !unlocked && styles.badgeLocked]}
                  accessibilityLabel={`${badge.name} badge${unlocked ? ', unlocked' : ', locked'}`}
                >
                  <View style={[styles.badgeIconCircle, unlocked && { backgroundColor: Colors.accent + '20' }]}>
                    <Ionicons
                      name={iconName}
                      size={24}
                      color={unlocked ? Colors.accent : Colors.text.tertiary}
                    />
                  </View>
                  <Text style={[styles.badgeName, !unlocked && styles.lockedText]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  <Text style={[styles.badgeDesc, !unlocked && styles.lockedText]} numberOfLines={2}>
                    {badge.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Streak Freeze */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Freeze Tokens</Text>
          <Text style={styles.explainText}>
            Protects your streak for one missed day. Earn one every 14 consecutive days (max 2 per habit).
          </Text>
          {habits.length === 0 ? (
            <Text style={styles.emptyText}>No habits yet</Text>
          ) : (
            <View style={styles.freezeList}>
              {habits.map(h => (
                <View key={h.id} style={styles.freezeRow}>
                  <Text style={styles.freezeHabit} numberOfLines={1}>{h.title}</Text>
                  <View style={styles.freezeTokens}>
                    {[0, 1].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.freezeDot,
                          i < h.freezeTokens && styles.freezeDotFilled,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  // Stats summary
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border.subtle,
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
    lineHeight: 20,
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.text.tertiary,
  },
  // Badge grid — 2 columns
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: Typography.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  lockedText: {
    color: Colors.text.tertiary,
  },
  // Streak freeze
  freezeList: {
    gap: Spacing.sm,
  },
  freezeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  freezeHabit: {
    fontSize: Typography.sm,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.md,
  },
  freezeTokens: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  freezeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  freezeDotFilled: {
    backgroundColor: Colors.streakFrozen,
    borderColor: Colors.streakFrozen,
  },
});
