import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {CountRow} from '../../api/insights';
import {colors, radius, type} from '../../theme';

type Props = {
  rows: CountRow[];
  // Two per row, so this is how many rows are drawn before "see the rest".
  limit?: number;
  icons?: Record<string, string>;
  // FR-INS-012: tapping a pattern opens its article in the learning library.
  onPress?: (row: CountRow) => void;
};

// One small picture per thinking pattern, so the grid reads at a glance.
export const TRAP_ICONS: Record<string, string> = {
  all_or_nothing: '⚖️',
  overgeneralising: '🌀',
  mental_filter: '🔍',
  discounting_positives: '🚫',
  mind_reading: '💭',
  fortune_telling: '🔮',
  catastrophising: '⛈️',
  magnifying_minimising: '🔎',
  emotional_reasoning: '💗',
  should_statements: '📏',
  labelling: '🏷️',
  personalising: '👤',
  blaming: '👉',
  comparing: '↔️',
  what_if: '❓',
};

// FR-INS-007: the number under each name is a count of entries, never a
// percentage, and the bar is drawn against the most frequent one.
export default function CountGrid({rows, limit = 4, icons, onPress}: Props) {
  const shown = rows.slice(0, limit);
  const highest = Math.max(1, ...rows.map(row => row.count));

  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
      {shown.map(row => (
        <Pressable
          key={row.id}
          onPress={onPress ? () => onPress(row) : undefined}
          style={{
            // Two to a row, with the gap taken off.
            width: '47.5%',
            flexGrow: 1,
            backgroundColor: colors.surfaceRaised,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.card,
            padding: 12,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {icons ? <Text style={{fontSize: 16}}>{icons[row.id] ?? '•'}</Text> : null}
            <Text style={{...type.small, color: colors.ink, flex: 1}} numberOfLines={2}>
              {row.name}
            </Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'baseline', marginTop: 8}}>
            <Text style={{...type.label, fontWeight: '600'}}>{row.count}</Text>
            <Text style={{...type.small, marginLeft: 4, flex: 1}}>
              {row.count === 1 ? 'entry' : 'entries'}
            </Text>
            {/* FR-INS-011: the change from the period before, when there was one. */}
            {row.change !== undefined && row.change !== 0 ? (
              <Text style={{...type.small, fontSize: 12}}>
                {row.change > 0 ? '+' : '−'}
                {Math.abs(row.change)}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.line,
              marginTop: 8,
              overflow: 'hidden',
            }}>
            <View
              style={{
                width: `${(row.count / highest) * 100}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.accent,
              }}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}
