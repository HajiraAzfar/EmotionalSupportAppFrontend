import React, {useState} from 'react';
import {LayoutChangeEvent, View} from 'react-native';
import Svg, {Line, Rect, Text as SvgText} from 'react-native-svg';

import {chartLabel, colors} from '../../theme';

export type Bar = {
  key: string;
  label: string;
  count: number;
};

type Props = {
  bars: Bar[];
  height?: number;
};

const PADDING = {top: 12, right: 6, bottom: 30, left: 24};
const GAP = 8;

// FR-INS-007: the height of a bar is a count of entries, never a percentage.
export default function BarChart({bars, height = 160}: Props) {
  const [width, setWidth] = useState(0);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = Math.max(height - PADDING.top - PADDING.bottom, 1);
  const highest = Math.max(1, ...bars.map(b => b.count));
  const barWidth = Math.max((plotWidth - GAP * (bars.length - 1)) / Math.max(bars.length, 1), 2);

  const y = (count: number) => PADDING.top + plotHeight - (count / highest) * plotHeight;
  // Whole entries only, and at most three lines so the axis stays quiet.
  const gridValues = highest <= 3 ? [...Array(highest + 1).keys()] : [0, Math.round(highest / 2), highest];

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
              <SvgText
                x={PADDING.left - 6}
                y={y(value) + 3.5}
                {...chartLabel}
                textAnchor="end">
                {value}
              </SvgText>
            </React.Fragment>
          ))}

          {bars.map((bar, index) => {
            const left = PADDING.left + index * (barWidth + GAP);
            const top = y(bar.count);
            return (
              <React.Fragment key={bar.key}>
                {bar.count > 0 && (
                  <Rect
                    x={left}
                    y={top}
                    width={barWidth}
                    height={PADDING.top + plotHeight - top}
                    rx={3}
                    fill={colors.sage}
                  />
                )}
                <SvgText
                  x={left + barWidth / 2}
                  y={height - 16}
                  {...chartLabel}
                  textAnchor="middle">
                  {bar.label}
                </SvgText>
                {bar.count > 0 && (
                  <SvgText
                    x={left + barWidth / 2}
                    y={top - 4}
                    {...chartLabel}
                    fill={colors.inkSoft}
                    textAnchor="middle">
                    {bar.count}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
