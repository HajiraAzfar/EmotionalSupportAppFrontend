import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {RatingSet} from '../../api/entries';
import {colors, radius, type} from '../../theme';

// One rating per feeling she named. The server stores 0-100; she is shown eleven
// stops, each with the words that say what it means. A bare slider number was
// the thing that read as meaningless on screen — "60 out of 100" of hurt tells
// her nothing that "quite strong" does not tell her better. The number is still
// what travels, so the stored data is the brief's 0-100.
const STOPS = [
  'Hardly there',
  'Just a trace',
  'Slight',
  'Mild',
  'Noticeable',
  'Moderate',
  'Quite strong',
  'Strong',
  'Very strong',
  'Filling most of me',
  'As strong as it gets',
];

type Props = {
  rates: RatingSet;
  // id → rating, as it stands. Absent means she has not rated that one, which
  // is allowed: a feeling she cannot put a number on stays unrated.
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  busy?: boolean;
};

export function stopsFor(rates: RatingSet): number[] {
  const span = rates.max - rates.min;
  return STOPS.map((_, index) => rates.min + Math.round((span * index) / (STOPS.length - 1)));
}

// The stop nearest a stored rating, so a carried-over number lands on a word.
function nearestStop(stops: number[], rating: number): number {
  return stops.reduce((best, stop) =>
    Math.abs(stop - rating) < Math.abs(best - rating) ? stop : best,
  );
}

export default function RatingSetControl({rates, value, onChange, busy}: Props) {
  const stops = stopsFor(rates);

  return (
    <View style={{gap: 18}}>
      {rates.items.map(item => {
        const rating = value[item.id];
        const chosen = rating === undefined ? undefined : nearestStop(stops, rating);
        return (
          <View key={item.id} style={{gap: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 8}}>
              <Text style={{...type.label, fontSize: 16, color: colors.ink}}>{item.name}</Text>
              {chosen !== undefined && (
                <Text style={type.small}>{STOPS[stops.indexOf(chosen)]}</Text>
              )}
            </View>
            <View style={{flexDirection: 'row', gap: 4}}>
              {stops.map((stop, index) => {
                const selected = chosen === stop;
                return (
                  <Pressable
                    key={stop}
                    disabled={busy}
                    onPress={() => onChange({...value, [item.id]: stop})}
                    accessibilityRole="button"
                    accessibilityState={{selected}}
                    accessibilityLabel={`${item.name}: ${STOPS[index]}`}
                    hitSlop={{top: 10, bottom: 10}}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: radius.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors.accent : colors.glass,
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.glassEdge,
                      opacity: busy ? 0.5 : 1,
                    }}>
                    {/* The number is small and secondary: the words above carry
                        the meaning, and she can still see the scale she is on. */}
                    <Text
                      style={{
                        ...type.tiny,
                        color: selected ? colors.onAccent : colors.inkSoft,
                      }}>
                      {index}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {/* The ends, named. Before she picks anything the row is otherwise
                eleven bare numbers, and a number on its own says nothing about
                how a feeling sits. */}
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={type.tiny}>{STOPS[0]}</Text>
              <Text style={type.tiny}>{STOPS[STOPS.length - 1]}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
