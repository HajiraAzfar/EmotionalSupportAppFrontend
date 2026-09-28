import React, {useState} from 'react';
import {LayoutChangeEvent, View} from 'react-native';
import Svg, {Circle, Line, Path, Text as SvgText} from 'react-native-svg';

import {colors} from '../../theme';

export type SeriesPoint = {
  date: string;
  value: number;
  // Absent when the point stands for a week rather than one entry.
  entry_id?: string;
};

type Props = {
  points: SeriesPoint[];
  // The ends of the scale, from the API — the chart never assumes them.
  min: number;
  max: number;
  height?: number;
  // Labels for the two ends of the y axis, e.g. "Very low" / "Very good".
  lowLabel?: string;
  highLabel?: string;
  // FR-INS-019: false draws the line with no numbers on the axis at all.
  showValues?: boolean;
  onSelect?: (point: SeriesPoint) => void;
};

const PADDING = {top: 10, right: 10, bottom: 22, left: 30};
const DOT = 4.5;
const TOUCH = 16;

function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
}

function dayNumber(iso: string) {
  return Math.floor(new Date(`${iso}T00:00:00`).getTime() / 86400000);
}

// FR-INS-003/004/009: one dot per recorded value, placed on the day it was
// recorded. Days without an entry are not filled in — they show as a wider gap
// between two dots, which is what actually happened.
export default function LineChart({
  points,
  min,
  max,
  height = 170,
  lowLabel,
  highLabel,
  showValues = true,
  onSelect,
}: Props) {
  const [width, setWidth] = useState(0);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = Math.max(height - PADDING.top - PADDING.bottom, 1);

  const days = points.map(p => dayNumber(p.date));
  const firstDay = Math.min(...days);
  const lastDay = Math.max(...days);
  const span = Math.max(lastDay - firstDay, 1);
  const range = Math.max(max - min, 1);

  const x = (point: SeriesPoint) =>
    // All on one day: put the single column in the middle rather than at the edge.
    PADDING.left + (lastDay === firstDay ? plotWidth / 2 : ((dayNumber(point.date) - firstDay) / span) * plotWidth);
  const y = (value: number) => PADDING.top + plotHeight - ((value - min) / range) * plotHeight;

  // Three gridlines: the two ends of the scale and its middle.
  const gridValues = [min, min + range / 2, max];

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point)} ${y(point.value)}`)
    .join(' ');

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {gridValues.map(value => (
            <React.Fragment key={value}>
              <Line
                x1={PADDING.left}
                y1={y(value)}
                x2={width - PADDING.right}
                y2={y(value)}
                stroke={colors.line}
                strokeWidth={1}
              />
              {showValues && (
                <SvgText
                  x={PADDING.left - 6}
                  y={y(value) + 3.5}
                  fontSize={10}
                  fill={colors.inkFaint}
                  textAnchor="end">
                  {Number.isInteger(value) ? String(value) : value.toFixed(1)}
                </SvgText>
              )}
            </React.Fragment>
          ))}

          {points.length > 1 && (
            <Path d={path} stroke={colors.sage} strokeWidth={2} fill="none" />
          )}

          {points.map(point => (
            <React.Fragment key={point.entry_id ?? point.date}>
              <Circle cx={x(point)} cy={y(point.value)} r={DOT} fill={colors.forest} />
              {/* An invisible, finger-sized target over each dot. */}
              <Circle
                cx={x(point)}
                cy={y(point.value)}
                r={TOUCH}
                fill="transparent"
                onPress={onSelect ? () => onSelect(point) : undefined}
              />
            </React.Fragment>
          ))}

          {/* Only the ends are labelled; a date under every dot is unreadable. */}
          <SvgText x={PADDING.left} y={height - 6} fontSize={10} fill={colors.inkFaint}>
            {shortDate(points[0].date)}
          </SvgText>
          {points.length > 1 && (
            <SvgText
              x={width - PADDING.right}
              y={height - 6}
              fontSize={10}
              fill={colors.inkFaint}
              textAnchor="end">
              {shortDate(points[points.length - 1].date)}
            </SvgText>
          )}

          {lowLabel && (
            <SvgText x={width - PADDING.right} y={y(min) - 6} fontSize={10} fill={colors.inkFaint} textAnchor="end">
              {lowLabel}
            </SvgText>
          )}
          {highLabel && (
            <SvgText x={width - PADDING.right} y={y(max) + 12} fontSize={10} fill={colors.inkFaint} textAnchor="end">
              {highLabel}
            </SvgText>
          )}
        </Svg>
      )}
    </View>
  );
}
