import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {border, colors, motion, radius, space, text, touch} from '../theme';

type Props<K extends string | number> = {
  label: string;
  options: {key: K; label: string}[];
  selected: K;
  onSelect: (key: K) => void;
  // Locked while a session is running.
  disabled?: boolean;
  // A line under the options, e.g. what the chosen one means.
  note?: string;
};

// A labelled row of choices, one of which is always picked.
export default function OptionRow<K extends string | number>({
  label,
  options,
  selected,
  onSelect,
  disabled = false,
  note,
}: Props<K>) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, disabled && styles.disabled]}>
        {options.map(option => {
          const on = option.key === selected;
          return (
            <Pressable
              key={String(option.key)}
              onPress={() => onSelect(option.key)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{checked: on, disabled}}
              style={[styles.option, on && styles.on]}>
              <Text style={[styles.optionLabel, on && styles.onLabel]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {marginBottom: space.md},
  label: {...text.small, marginBottom: space.sm},
  row: {flexDirection: 'row', gap: space.sm},
  disabled: {opacity: motion.disabledOpacity},
  option: {
    flex: 1,
    minHeight: touch.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderRadius: radius.card,
    borderWidth: border.width,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  on: {borderColor: colors.primary, backgroundColor: colors.selected},
  optionLabel: {...text.button, color: colors.inkSoft, textAlign: 'center'},
  onLabel: {color: colors.primary},
  note: {...text.small, marginTop: space.sm},
});
