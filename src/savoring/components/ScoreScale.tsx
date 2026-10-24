import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {colors, font, radius, type} from '../../theme';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  // What the scale is, for a screen reader: "Mood before".
  label: string;
  low?: string;
  high?: string;
};

const ROWS = [
  [0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
];

/**
 * 0 to 10 as two rows of large buttons (each at least 44 points), with the
 * ends named. Tapping the chosen one again clears it: every rating is optional.
 */
export default function ScoreScale({value, onChange, label, low = 'Very low', high = 'Very good'}: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      {ROWS.map(row => (
        <View key={row[0]} style={{flexDirection: 'row', gap: 6, marginBottom: 8}}>
          {row.map(n => {
            const on = value === n;
            return (
              <Pressable
                key={n}
                onPress={() => onChange(on ? null : n)}
                accessibilityRole="radio"
                accessibilityState={{checked: on}}
                accessibilityLabel={`${label}: ${n} out of 10${n === 0 ? `, ${low}` : n === 10 ? `, ${high}` : ''}`}
                style={{
                  // Six columns on every row, so the two rows line up on any width.
                  flex: 1,
                  minHeight: 44,
                  maxWidth: 56,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: on ? colors.accent : colors.line,
                  backgroundColor: on ? colors.sageWash : colors.surface,
                }}>
                <Text style={{...type.label, fontFamily: on ? font.bold : font.semibold, color: on ? colors.accent : colors.ink}}>
                  {n}
                </Text>
              </Pressable>
            );
          })}
          {row.length < 6 ? <View style={{flex: 1, maxWidth: 56}} /> : null}
        </View>
      ))}
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={type.tiny}>0 · {low}</Text>
        <Text style={type.tiny}>10 · {high}</Text>
      </View>
    </View>
  );
}
