import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {ScaleOption} from '../../api/entries';
import {colors, radius, type} from '../../theme';

// Up to this many options fit side by side with their labels (the 1-5 mood scale).
// More than that (the 0-10 distress scale) wraps as numbers, with the ends labelled.
const LABELLED_LIMIT = 6;

type Props = {
  options: ScaleOption[];
  busy: boolean;
  onSelect: (value: number) => void;
};

// FR-ENT-025: the control comes from the capture schedule, so only these
// values can be submitted.
export default function MoodScaleControl({options, busy, onSelect}: Props) {
  const compact = options.length > LABELLED_LIMIT;

  if (!compact) {
    return (
      <View style={{flexDirection: 'row', gap: 8}}>
        {options.map(option => (
          <Pressable
            key={option.value}
            disabled={busy}
            onPress={() => onSelect(option.value)}
            style={({pressed}) => ({
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              backgroundColor: pressed ? colors.sageWash : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.card,
              opacity: busy ? 0.5 : 1,
            })}>
            <Text style={{...type.title, fontSize: 22}}>{option.value}</Text>
            <Text style={{...type.small, textAlign: 'center', marginTop: 2}}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const first = options[0];
  const last = options[options.length - 1];

  return (
    <View>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {options.map(option => (
          <Pressable
            key={option.value}
            disabled={busy}
            onPress={() => onSelect(option.value)}
            style={({pressed}) => ({
              width: 52,
              alignItems: 'center',
              paddingVertical: 12,
              backgroundColor: pressed ? colors.sageWash : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.card,
              opacity: busy ? 0.5 : 1,
            })}>
            <Text style={{...type.title, fontSize: 20}}>{option.value}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
        <Text style={{...type.small, flex: 1}}>
          {first.value} — {first.label}
        </Text>
        <Text style={{...type.small, flex: 1, textAlign: 'right'}}>
          {last.value} — {last.label}
        </Text>
      </View>
    </View>
  );
}