import React, {useRef} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {MonthMood} from '../../api/insights';
import {colors, font, moodColours, moodDeep, radius, type} from '../../theme';

type Props = {
  months: MonthMood[];
  // The ends of the mood scale, from the API.
  min: number;
  max: number;
  // One name per point of the scale, lowest first ("Very low" … "Very good").
  labels: string[];
};

const TRACK = 120;
const COLUMN = 48;

// One soft track per month, filled to its average mood in that mood's colour
// (the calendar's colours), with the mood's name above and the month below.
// Many months scroll sideways, the latest in view.
export default function MonthBars({months, min, max, labels}: Props) {
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const years = new Set(months.map(m => m.month.slice(0, 4)));
  const latest = months[months.length - 1]?.month;

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scroller.current?.scrollToEnd({animated: false})}
      contentContainerStyle={{flexGrow: 1, justifyContent: 'space-around', gap: 8}}>
      {months.map(m => {
        const mood = Math.min(Math.max(Math.round(m.value), min), max) - min;
        const fill = (m.value - min + 1) / (max - min + 1);
        const name = new Date(`${m.month}-15T12:00`).toLocaleDateString(undefined, {
          month: 'short',
          ...(years.size > 1 ? {year: '2-digit'} : null),
        });
        const isLatest = m.month === latest;
        return (
          <View
            key={m.month}
            testID={`month-${m.month}`}
            accessible
            accessibilityLabel={`${name}: ${labels[mood]}, ${m.entries} ${m.entries === 1 ? 'check-in' : 'check-ins'}`}
            style={{width: COLUMN, alignItems: 'center', gap: 6}}>
            <Text numberOfLines={2} style={{...type.tiny, fontSize: 10, textAlign: 'center', minHeight: 26}}>
              {labels[mood]}
            </Text>
            <View
              style={{
                width: 22,
                height: TRACK,
                borderRadius: radius.pill,
                backgroundColor: colors.accentWash,
                justifyContent: 'flex-end',
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: Math.max(TRACK * fill, 22),
                  borderRadius: radius.pill,
                  backgroundImage: `linear-gradient(180deg, ${moodDeep[mood]}, ${moodColours[mood]})`,
                }}
              />
            </View>
            <Text
              style={{
                ...type.tiny,
                fontSize: 11,
                ...(isLatest ? {fontFamily: font.semibold, color: colors.ink} : null),
              }}>
              {name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
