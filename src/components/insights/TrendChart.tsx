import React, {useState} from 'react';
import {LayoutChangeEvent, Text, View} from 'react-native';
import Svg, {Circle, Line, Path, Text as SvgText} from 'react-native-svg';

import {chartLabel, colors, radius, type} from '../../theme';

export type TrendSeries = {
  id: string;
  name: string;
  counts: number[];
};

type Props = {
  // One label per point on the x axis, e.g. the Monday of each week.
  weeks: string[];
  series: TrendSeries[];
  height?: number;
};

// Up to three lines, so each keeps its own colour and the chart stays readable.
const LINE_COLOURS = [colors.forest, colors.sage, colors.alert];
const PADDING = {top: 10, right: 10, bottom: 22, left: 26};

function weekLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
}

// FR-INS-010 over time: how often each pattern came up, week by week. It shows
// what happened and nothing else — no explanation, no prediction (FR-INS-020).
export default function TrendChart({weeks, series, height = 170}: Props) {
  const [width, setWidth] = useState(0);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = Math.max(height - PADDING.top - PADDING.bottom, 1);
  const highest = Math.max(1, ...series.flatMap(s => s.counts));

  const x = (index: number) =>
    PADDING.left + (weeks.length === 1 ? plotWidth / 2 : (index / (weeks.length - 1)) * plotWidth);
  const y = (count: number) => PADDING.top + plotHeight - (count / highest) * plotHeight;

  // Whole numbers only: half a thinking pattern is not a thing.
  const gridValues = highest <= 3 ? [...Array(highest + 1).keys()] : [0, Math.round(highest / 2), highest];

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <>
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
                <SvgText
                  x={PADDING.left - 6}
                  y={y(value) + 3.5}
                  {...chartLabel}
                  textAnchor="end">
                  {value}
                </SvgText>
              </React.Fragment>
            ))}

            {series.map((line, lineIndex) => {
              const colour = LINE_COLOURS[lineIndex % LINE_COLOURS.length];
              const path = line.counts
                .map((count, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(count)}`)
                .join(' ');
              return (
                <React.Fragment key={line.id}>
                  {line.counts.length > 1 && (
                    <Path d={path} stroke={colour} strokeWidth={2} fill="none" />
                  )}
                  {line.counts.map((count, index) => (
                    <Circle key={index} cx={x(index)} cy={y(count)} r={3.5} fill={colour} />
                  ))}
                </React.Fragment>
              );
            })}

            <SvgText x={PADDING.left} y={height - 6} {...chartLabel}>
              {weekLabel(weeks[0])}
            </SvgText>
            {weeks.length > 1 && (
              <SvgText
                x={width - PADDING.right}
                y={height - 6}
                {...chartLabel}
                textAnchor="end">
                {weekLabel(weeks[weeks.length - 1])}
              </SvgText>
            )}
          </Svg>

          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6}}>
            {series.map((line, index) => (
              <View key={line.id} style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: radius.pill,
                    backgroundColor: LINE_COLOURS[index % LINE_COLOURS.length],
                  }}
                />
                <Text style={type.small}>{line.name}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
