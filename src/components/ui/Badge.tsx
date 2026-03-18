import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface BadgeProps {
  icon: string;
  name: string;
  description: string;
  unlocked?: boolean;
}

export function Badge({ icon, name, description, unlocked = false }: BadgeProps) {
  return (
    <View
      style={[styles.container, !unlocked && styles.locked]}
      accessibilityLabel={`${name} badge${unlocked ? ', unlocked' : ', locked'}`}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, !unlocked && styles.lockedText]}>{name}</Text>
        <Text style={[styles.description, !unlocked && styles.lockedText]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  locked: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  name: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  lockedText: {
    color: Colors.text.tertiary,
  },
});
