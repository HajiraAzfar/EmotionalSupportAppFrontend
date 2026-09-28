import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';

import {CalendarDay} from '../../api/insights';
import {colors, moodColours, type} from '../../theme';

type Props = {
  days: CalendarDay[];
  labels: string[];
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CELL = 30;

function iso(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// FR-INS-015: every day she completed an entry on, coloured by the mood she
// recorded that day. A day with an entry but no mood is outlined, not filled.
export default function MoodCalendar({days, labels}: Props) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDate = new Map(days.map(day => [day.date, day]));
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const cells: (Date | null)[] = [
    ...Array.from({length: lead}, () => null),
    ...Array.from({length: total}, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  function shift(months: number) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + months, 1));
  }

  return (
    <View>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
        <Pressable onPress={() => shift(-1)} hitSlop={14}>
          <Text style={{...type.label, color: colors.inkSoft}}>‹</Text>
        </Pressable>
        <Text style={{...type.label, flex: 1, textAlign: 'center'}}>
          {month.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}
        </Text>
        <Pressable onPress={() => shift(1)} hitSlop={14}>
          <Text style={{...type.label, color: colors.inkSoft}}>›</Text>
        </Pressable>
      </View>

      <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
        {WEEKDAYS.map(day => (
          <Text
            key={day}
            style={{...type.small, width: `${100 / 7}%`, textAlign: 'center', marginBottom: 8, fontSize: 11}}>
            {day}
          </Text>
        ))}

        {cells.map((date, index) => {
          const entry = date ? byDate.get(iso(date)) : undefined;
          const colour = entry?.mood ? moodColours[entry.mood - 1] : undefined;
          return (
            <View
              key={date ? iso(date) : `blank-${index}`}
              style={{width: `${100 / 7}%`, alignItems: 'center', marginBottom: 7}}>
              <View
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: CELL / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colour ?? 'transparent',
                  borderWidth: entry && !colour ? 1 : 0,
                  borderColor: colors.accentSoft,
                }}>
                <Text
                  style={{
                    ...type.small,
                    fontSize: 12,
                    color: colour ? colors.onAccent : colors.inkFaint,
                  }}>
                  {date ? date.getDate() : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6}}>
        {labels.map((label, index) => (
          <View key={label} style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
            <View style={{width: 9, height: 9, borderRadius: 5, backgroundColor: moodColours[index]}} />
            <Text style={{...type.small, fontSize: 12}}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
