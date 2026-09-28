import React, {useState} from 'react';
import {LayoutChangeEvent, Pressable, Text, View} from 'react-native';
import Svg, {Circle, Defs, Line, LinearGradient, Path, Stop} from 'react-native-svg';

import {MoodPoint} from '../../api/insights';
import {colors, moodFaces, radius, type} from '../../theme';

type Props = {
  points: MoodPoint[];
  min: number;
  max: number;
  // What each point of the scale is called, from `min` upwards.
  labels: string[];
  height?: number;
  onOpenEntry?: (entryId: string) => void;
};

const PADDING = {top: 26, right: 8, bottom: 26, left: 34};
const DOT = 5;

function dayNumber(iso: string) {
  return Math.floor(new Date(`${iso}T00:00:00`).getTime() / 86400000);
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
}

/**
 * A curve through the points rather than straight joins between them: the
 * same control points either side of each dot, which is what gives the line
 * its soft shape. Pure geometry — it never invents a dot that is not there.
 */
function smoothPath(coords: {x: number; y: number}[]): string {
  if (coords.length < 2) {
    return '';
  }
  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const previous = coords[i - 1] ?? coords[i];
    const current = coords[i];
    const next = coords[i + 1];
    const after = coords[i + 2] ?? next;
    // Catmull-Rom through the points, written as the bezier SVG understands.
    const c1x = current.x + (next.x - previous.x) / 6;
    const c1y = current.y + (next.y - previous.y) / 6;
    const c2x = next.x - (after.x - current.x) / 6;
    const c2y = next.y - (after.y - current.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${next.x} ${next.y}`;
  }
  return path;
}

// FR-INS-003/004/005: one dot per recorded mood, on the day it was recorded.
// Days without an entry are a gap in the line, never an invented value.
export default function MoodAreaChart({points, min, max, labels, height = 210, onOpenEntry}: Props) {
  const [width, setWidth] = useState(0);
  const [chosen, setChosen] = useState<MoodPoint | null>(null);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = Math.max(height - PADDING.top - PADDING.bottom, 1);
  const range = Math.max(max - min, 1);

  const days = points.map(p => dayNumber(p.date));
  const first = Math.min(...days);
  const last = Math.max(...days);
  const span = Math.max(last - first, 1);

  const xOf = (point: MoodPoint) =>
    PADDING.left + (last === first ? plotWidth / 2 : ((dayNumber(point.date) - first) / span) * plotWidth);
  const yOf = (value: number) => PADDING.top + plotHeight - ((value - min) / range) * plotHeight;

  const coords = points.map(point => ({x: xOf(point), y: yOf(point.value)}));
  const line = smoothPath(coords);
  const baseline = PADDING.top + plotHeight;
  const area = line
    ? `${line} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`
    : '';

  const steps = Array.from({length: range + 1}, (_, i) => min + i);
  // Six dates along the bottom at most, or they collide.
  const ticks = points.filter((_, index) => index % Math.ceil(points.length / 6) === 0);

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <View>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity={0.5} />
                <Stop offset="1" stopColor={colors.accent} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {steps.map(value => (
              <Line
                key={value}
                x1={PADDING.left}
                y1={yOf(value)}
                x2={width - PADDING.right}
                y2={yOf(value)}
                stroke={colors.line}
                strokeWidth={0.5}
              />
            ))}

            {area ? <Path d={area} fill="url(#moodFill)" /> : null}
            {line ? <Path d={line} stroke={colors.accent} strokeWidth={2.5} fill="none" /> : null}

            {/* The chosen point gets the marker line the design shows. */}
            {chosen ? (
              <Line
                x1={xOf(chosen)}
                y1={PADDING.top - 6}
                x2={xOf(chosen)}
                y2={baseline}
                stroke={colors.inkFaint}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ) : null}

            {points.map(point => {
              const on = chosen?.date === point.date && chosen?.entry_id === point.entry_id;
              return (
                <Circle
                  key={point.entry_id ?? point.date}
                  cx={xOf(point)}
                  cy={yOf(point.value)}
                  r={on ? DOT + 1.5 : DOT}
                  fill={on ? colors.surface : colors.accent}
                  stroke={colors.accent}
                  strokeWidth={on ? 3 : 2}
                />
              );
            })}
          </Svg>

          {/* The faces sit outside the Svg, where emoji render as text. */}
          {steps.map(value => (
            <Text
              key={value}
              style={{position: 'absolute', left: 6, top: yOf(value) - 9, fontSize: 14}}>
              {moodFaces[value - 1] ?? ''}
            </Text>
          ))}

          {/* Finger-sized targets over each dot. */}
          {points.map(point => (
            <Pressable
              key={`tap-${point.entry_id ?? point.date}`}
              onPress={() =>
                setChosen(chosen?.entry_id === point.entry_id && chosen?.date === point.date ? null : point)
              }
              style={{
                position: 'absolute',
                left: xOf(point) - 20,
                top: yOf(point.value) - 20,
                width: 40,
                height: 40,
              }}
            />
          ))}

          {chosen ? (
            <Pressable
              onPress={() => chosen.entry_id && onOpenEntry?.(chosen.entry_id)}
              style={{
                position: 'absolute',
                left: Math.min(Math.max(xOf(chosen) - 55, 0), Math.max(width - 110, 0)),
                top: Math.max(yOf(chosen.value) - 56, 0),
                width: 110,
                alignItems: 'center',
                backgroundColor: colors.surfaceRaised,
                borderRadius: radius.card,
                paddingVertical: 7,
              }}>
              <Text style={{...type.small, color: colors.ink, fontSize: 12}}>
                {labels[chosen.value - min] ?? chosen.value}
              </Text>
              <Text style={{...type.small, fontSize: 11}}>{shortDate(chosen.date)}</Text>
            </Pressable>
          ) : null}

          {/* Dates along the bottom, in the plot's own coordinates. */}
          {ticks.map(point => (
            <Text
              key={`tick-${point.entry_id ?? point.date}`}
              style={{
                position: 'absolute',
                top: height - 18,
                left: xOf(point) - 22,
                width: 44,
                textAlign: 'center',
                ...type.small,
                fontSize: 11,
              }}>
              {new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
