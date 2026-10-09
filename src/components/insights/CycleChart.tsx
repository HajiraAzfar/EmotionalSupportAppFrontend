import React, {useState} from 'react';
import {LayoutChangeEvent, Text, View} from 'react-native';
import Svg, {Line, Rect, Text as SvgText} from 'react-native-svg';

import {ExposureCycle} from '../../api/insights';
import {chartLabel, colors, radius, type} from '../../theme';

type Props = {
  cycles: ExposureCycle[];
  // The ends of the distress scale, so the bars are comparable across cycles.
  min?: number;
  max?: number;
  height?: number;
};

// FR-INS-013: the three distress values of each cycle, side by side, in the
// order the cycles were completed. Nothing here says whether a number is good.
const BARS = [
  {key: 'before' as const, label: 'Before', colour: colors.inkFaint},
  {key: 'during' as const, label: 'During', colour: colors.sage},
  {key: 'after' as const, label: 'After', colour: colors.forest},
];

const PADDING = {top: 12, right: 6, bottom: 28, left: 24};
const GROUP_GAP = 14;
const BAR_GAP = 3;

export default function CycleChart({cycles, min = 0, max = 10, height = 170}: Props) {
  const [width, setWidth] = useState(0);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = Math.max(height - PADDING.top - PADDING.bottom, 1);
  const range = Math.max(max - min, 1);

  const groupWidth = Math.max(
    (plotWidth - GROUP_GAP * Math.max(cycles.length - 1, 0)) / Math.max(cycles.length, 1),
    6,
  );
  const barWidth = Math.max((groupWidth - BAR_GAP * (BARS.length - 1)) / BARS.length, 2);
  const y = (value: number) => PADDING.top + plotHeight - ((value - min) / range) * plotHeight;

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <>
          <Svg width={width} height={height}>
            {[min, (min + max) / 2, max].map(value => (
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

            {cycles.map((cycle, index) => {
              const groupLeft = PADDING.left + index * (groupWidth + GROUP_GAP);
              return (
                <React.Fragment key={cycle.entry_id}>
                  {BARS.map((bar, barIndex) => {
                    const value = cycle[bar.key];
                    if (value === null || value === undefined) {
                      return null;
                    }
                    const left = groupLeft + barIndex * (barWidth + BAR_GAP);
                    const top = y(value);
                    return (
                      <Rect
                        key={bar.key}
                        x={left}
                        y={top}
                        // A recorded zero still deserves a mark on the chart.
                        height={Math.max(PADDING.top + plotHeight - top, 1.5)}
                        width={barWidth}
                        rx={2}
                        fill={bar.colour}
                      />
                    );
                  })}
                  <SvgText
                    x={groupLeft + groupWidth / 2}
                    y={height - 14}
                    {...chartLabel}
                    textAnchor="middle">
                    Cycle {cycle.cycle}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>

          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12}}>
            {BARS.map(bar => (
              <View key={bar.key} style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <View style={{width: 10, height: 10, borderRadius: radius.pill, backgroundColor: bar.colour}} />
                <Text style={type.small}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
