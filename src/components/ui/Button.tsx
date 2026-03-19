import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors, ThemeColors, Typography, Spacing, Radius } from '../../constants/theme';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({ variant = 'primary', label, onPress, disabled, loading, icon, style }: ButtonProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bgColor = {
    primary: Colors.accent,
    secondary: Colors.background.tertiary,
    ghost: 'transparent',
    danger: Colors.danger,
  }[variant];

  const textColor = {
    primary: Colors.text.primary,
    secondary: Colors.text.primary,
    ghost: Colors.text.secondary,
    danger: Colors.text.primary,
  }[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { backgroundColor: bgColor },
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ghost: {
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
});
