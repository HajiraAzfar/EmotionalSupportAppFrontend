import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {border, colors, radius, space, text, touch} from '../theme';

type Props<K extends string | number> = {
  label: string;
  options: {key: K; label: string}[];
  selected: K;
  onSelect: (key: K) => void;
};

// A labelled set of choices that wraps onto more lines; one is always picked.
export default function ChoiceChips<K extends string | number>({
  label,
  options,
  selected,
  onSelect,
}: Props<K>) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map(option => {
          const on = option.key === selected;
          return (
            <Pressable
              key={String(option.key)}
              onPress={() => onSelect(option.key)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{checked: on}}
              style={[styles.chip, on && styles.on]}>
              <Text style={[styles.chipLabel, on && styles.onLabel]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {marginBottom: space.md},
  label: {...text.small, marginBottom: space.sm},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: space.sm},
  chip: {
    minHeight: touch.minHeight - space.sm,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: border.width,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  on: {borderColor: colors.primary, backgroundColor: colors.selected},
  chipLabel: {...text.button, fontSize: text.small.fontSize, color: colors.inkSoft},
  onLabel: {color: colors.primary},
});
