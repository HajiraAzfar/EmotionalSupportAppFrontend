import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {ScaleOption} from '../../api/entries';
import {colors, glass, radius, type} from '../../theme';

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
            style={{flex: 1, alignItems: 'center', opacity: busy ? 0.5 : 1}}>
            {({pressed}) => (
              <>
                <View
                  style={{
                    ...glass,
                    width: 52,
                    height: 52,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? colors.accentWash : colors.glass,
                    borderColor: pressed ? colors.accent : colors.glassEdge,
                  }}>
                  <Text style={type.heading}>{option.value}</Text>
                </View>
                <Text style={{...type.tiny, textAlign: 'center', marginTop: 6}}>
                  {option.label}
                </Text>
              </>
            )}
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
              ...glass,
              width: 46,
              height: 46,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? colors.accentWash : colors.glass,
              borderColor: pressed ? colors.accent : colors.glassEdge,
              borderRadius: radius.pill,
              opacity: busy ? 0.5 : 1,
            })}>
            <Text style={type.heading}>{option.value}</Text>
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