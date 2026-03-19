import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, ThemeColors, Typography, Spacing, Radius } from '@/constants/theme';
import { Category } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PRESET_COLORS = [
  '#60A5FA',
  '#22C55E',
  '#A78BFA',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#14B8A6',
  '#EAB308',
  '#8B5CF6',
  '#06B6D4',
];

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (categoryId: string | undefined) => void;
  onCreateCategory: (data: { name: string; color: string }) => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  onCreateCategory,
}: CategoryPickerProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const inputRef = useRef<TextInput>(null);

  const handleAdd = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCancel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAdding(false);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
  };

  const handleSubmit = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateCategory({ name: trimmed, color: newColor });
    handleCancel();
  };

  return (
    <View>
      {/* Chip row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {/* None chip */}
        <TouchableOpacity
          style={[styles.chip, !selectedId && styles.chipSelected]}
          onPress={() => onSelect(undefined)}
          activeOpacity={0.7}
          accessibilityLabel="No category"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.chipText,
              !selectedId && styles.chipTextSelected,
            ]}
          >
            None
          </Text>
        </TouchableOpacity>

        {/* Category chips */}
        {categories.map((cat) => {
          const isSelected = cat.id === selectedId;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.7}
              accessibilityLabel={`${cat.name} category`}
              accessibilityRole="button"
            >
              <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add chip */}
        <TouchableOpacity
          style={[styles.chip, styles.addChip]}
          onPress={handleAdd}
          activeOpacity={0.7}
          accessibilityLabel="Add category"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Inline add form */}
      {isAdding && (
        <View style={styles.addForm}>
          <View style={styles.inputRow}>
            <View style={[styles.colorDot, { backgroundColor: newColor }]} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Category name"
              placeholderTextColor={Colors.text.tertiary}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              maxLength={30}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.formButton}
              activeOpacity={0.7}
              accessibilityLabel="Confirm new category"
            >
              <Ionicons name="checkmark-circle" size={28} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.formButton}
              activeOpacity={0.7}
              accessibilityLabel="Cancel adding category"
            >
              <Ionicons name="close-circle" size={28} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Color picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRow}
          >
            {PRESET_COLORS.map((color) => {
              const isChosen = color === newColor;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewColor(color)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Select color ${color}`}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      isChosen && styles.colorCircleSelected,
                    ]}
                  >
                    {isChosen && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    chipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.full,
      backgroundColor: Colors.background.tertiary,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    chipSelected: {
      borderColor: Colors.accent,
      backgroundColor: Colors.accentLight,
    },
    chipText: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: Colors.text.secondary,
    },
    chipTextSelected: {
      color: Colors.accent,
      fontWeight: Typography.semibold,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: Radius.full,
    },
    addChip: {
      paddingHorizontal: Spacing.sm,
    },
    addForm: {
      backgroundColor: Colors.background.secondary,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginTop: Spacing.sm,
      gap: Spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: Typography.base,
      color: Colors.text.primary,
      backgroundColor: Colors.background.tertiary,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    formButton: {
      padding: Spacing['2xs'],
    },
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    colorCircle: {
      width: 28,
      height: 28,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorCircleSelected: {
      borderColor: Colors.text.primary,
    },
  });
