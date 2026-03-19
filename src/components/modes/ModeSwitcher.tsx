import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius } from '../../constants/theme';
import { Modes } from '../../constants/modes';
import { useModeStore } from '../../store/useModeStore';
import type { Mode } from '../../types';
import type { ThemeColors } from '../../constants/theme';

export function ModeSwitcher() {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const { currentMode, setMode } = useModeStore();
  const modes = Object.values(Modes);

  return (
    <View style={styles.container}>
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        return (
          <TouchableOpacity
            key={mode.id}
            onPress={() => setMode(mode.id)}
            accessibilityRole="tab"
            accessibilityLabel={mode.label}
            accessibilityState={{ selected: isActive }}
            style={[styles.tab, isActive && { borderBottomColor: mode.primaryColor }]}
          >
            <Ionicons
              name={mode.tabIcon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={isActive ? mode.primaryColor : Colors.text.tertiary}
            />
            <Text style={[styles.label, isActive && { color: mode.primaryColor }]}>
              {mode.label.replace(' Mode', '')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing['2xs'],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
