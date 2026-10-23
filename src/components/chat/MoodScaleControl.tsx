import React from 'react';
import {Pressable, Text, View} from 'react-native';

import MoodFace from '../MoodFace';
import {ScaleOption} from '../../api/entries';
import {colors, glass, radius, type} from '../../theme';

// Up to this many options fit side by side with their labels (the 1-5 mood scale).
// More than that (the 0-10 distress scale) wraps as numbers, with the ends labelled.
const LABELLED_LIMIT = 6;

type Props = {
  options: ScaleOption[];
  busy: boolean;
  onSelect: (value: number) => void;
  // The mood scale wears a face as well as its number and name. Only mood:
  // a distress or intensity number is information, and a face would read as
  // the app having an opinion about it.
  faces?: boolean;
};

// FR-ENT-025: the control comes from the capture schedule, so only these
// values can be submitted.
export default function MoodScaleControl({options, busy, onSelect, faces}: Props) {
  const compact = options.length > LABELLED_LIMIT;

  if (!compact) {
    return (
      <View style={{flexDirection: 'row', gap: 8}}>
        {options.map((option, index) => (
          <Pressable
            key={option.value}
            disabled={busy}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityLabel={faces ? option.label : `${option.value}, ${option.label}`}
            style={{flex: 1, alignItems: 'center', opacity: busy ? 0.5 : 1}}>
            {({pressed}) =>
              faces ? (
                <>
                  {/* A ring shows the face being pressed; it is always there,
                      only its colour changes. */}
                  <View
                    style={{
                      padding: 3,
                      borderRadius: radius.pill,
                      borderWidth: 2,
                      borderColor: pressed ? colors.accent : 'transparent',
                    }}>
                    <MoodFace level={index + 1} size={50} />
                  </View>
                  <Text style={{...type.tiny, textAlign: 'center', marginTop: 6}}>
                    {option.label}
                  </Text>
                </>
              ) : (
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

  // A long scale (0-10) as rows: every number keeps its own words, so she is
  // never asked for an 8 without being told what an 8 means. Side by side the
  // labels do not fit, and labelling only the two ends leaves nine numbers
  // standing for nothing.
  return (
    <View style={{gap: 6}}>
      {options.map(option => (
        <Pressable
          key={option.value}
          disabled={busy}
          onPress={() => onSelect(option.value)}
          accessibilityRole="button"
          accessibilityLabel={`${option.value}, ${option.label}`}
          style={({pressed}) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            minHeight: 44,
            paddingHorizontal: 12,
            borderRadius: radius.tile,
            backgroundColor: pressed ? colors.accentWash : colors.glass,
            borderWidth: 1,
            borderColor: pressed ? colors.accent : colors.glassEdge,
            opacity: busy ? 0.5 : 1,
          })}>
          <Text style={{...type.label, width: 24, textAlign: 'center', color: colors.accent}}>
            {option.value}
          </Text>
          <Text style={{...type.body, flex: 1, color: colors.ink}}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
