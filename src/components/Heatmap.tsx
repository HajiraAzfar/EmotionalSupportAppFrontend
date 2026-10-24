import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {type} from '../theme';

export interface HeatmapCell {
  date: string;
  level: 0 | 1 | 2 | 3;
  points: number;
  grace_day: boolean;
}

// One calm hue in lightness steps, so it reads without telling colours apart;
// "none" is a neutral grey, never red. A theme per journal (and per dark mode).
export interface HeatmapTheme {
  empty: string;
  levels: [string, string, string];
  grace: string;
  label: string;
}

export const LAVENDER_LIGHT: HeatmapTheme = {
  empty: '#ECE9EF',
  levels: ['#D6CBEF', '#A592D9', '#6A55A6'],
  grace: '#8E7CC3',
  label: '#6F6680',
};

// For when the app has a dark mode (it does not yet).
export const LAVENDER_DARK: HeatmapTheme = {
  empty: '#2B2633',
  levels: ['#4A3F6A', '#7965B3', '#B9A9E2'],
  grace: '#B9A9E2',
  label: '#B5ABC2',
};

type Props = {
  days: HeatmapCell[];
  theme?: HeatmapTheme;
  cell?: number;
  monthLabels?: boolean;
  onDayPress?: (date: string) => void;
};

const GAP = 3;
const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
// Monday 0 … Sunday 6.
const weekday = (iso: string) => (parse(iso).getDay() + 6) % 7;

function spoken(cell: HeatmapCell) {
  const d = parse(cell.date);
  const day = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const points = cell.points === 0 ? 'no moments' : `${cell.points} ${cell.points === 1 ? 'point' : 'points'}`;
  return `${day}: ${points}${cell.grace_day ? ', a rest day' : ''}`;
}

/**
 * A contribution heatmap: a column per week (Monday at the top), a square per
 * day, its shade the day's level. A grace day has a dotted edge. Only levels
 * are shown, never what was written; every square says its day and points to
 * a screen reader, and a tap opens that day.
 */
export default function Heatmap({days, theme = LAVENDER_LIGHT, cell = 14, monthLabels = false, onDayPress}: Props) {
  if (!days.length) {
    return null;
  }
  // Pad the first week back to Monday, so each column is one whole week.
  const columns: (HeatmapCell | null)[][] = [];
  let column: (HeatmapCell | null)[] = Array(weekday(days[0].date)).fill(null);
  for (const day of days) {
    column.push(day);
    if (column.length === 7) {
      columns.push(column);
      column = [];
    }
  }
  if (column.length) {
    columns.push(column);
  }

  const fill = (level: number) => (level === 0 ? theme.empty : theme.levels[level - 1]);
  const label = {...type.tiny, color: theme.label, fontSize: 10};
  const step = cell + GAP;

  return (
    <View style={{flexDirection: 'row'}}>
      <View style={{marginRight: 4, marginTop: monthLabels ? 14 : 0}}>
        {WEEKDAYS.map((name, i) => (
          <Text key={i} style={{...label, height: step, lineHeight: cell}}>
            {name}
          </Text>
        ))}
      </View>
      <View>
        {monthLabels ? (
          <View style={{flexDirection: 'row', height: 14}}>
            {columns.map((week, i) => {
              // A month is named over the week its 1st falls in.
              const first = week.find(d => d && parse(d.date).getDate() === 1);
              return (
                <View key={i} style={{width: step}}>
                  {first ? (
                    <Text style={{...label, width: step * 3}} numberOfLines={1}>
                      {MONTHS[parse(first.date).getMonth()]}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
        <View style={{flexDirection: 'row'}}>
          {columns.map((week, i) => (
            <View key={i} style={{marginRight: GAP}}>
              {week.map((day, j) =>
                day ? (
                  <Pressable
                    key={day.date}
                    onPress={onDayPress ? () => onDayPress(day.date) : undefined}
                    disabled={!onDayPress}
                    accessibilityRole="button"
                    accessibilityLabel={spoken(day)}
                    hitSlop={2}
                    style={{
                      width: cell,
                      height: cell,
                      marginBottom: GAP,
                      borderRadius: 3,
                      backgroundColor: fill(day.level),
                      borderWidth: day.grace_day ? 1.5 : 0,
                      borderStyle: 'dotted',
                      borderColor: theme.grace,
                    }}
                  />
                ) : (
                  <View key={`pad-${j}`} style={{width: cell, height: cell, marginBottom: GAP}} />
                ),
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// "Less ▢▢▢▢ More", the shades in order.
export function HeatmapLegend({theme = LAVENDER_LIGHT, less, more}: {theme?: HeatmapTheme; less: string; more: string}) {
  const label = {...type.tiny, color: theme.label};
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}} accessibilityLabel={`${less} to ${more}`}>
      <Text style={label}>{less}</Text>
      {[theme.empty, ...theme.levels].map(colour => (
        <View key={colour} style={{width: 12, height: 12, borderRadius: 3, backgroundColor: colour}} />
      ))}
      <Text style={label}>{more}</Text>
    </View>
  );
}
