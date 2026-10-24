import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, View} from 'react-native';

import {colors, type} from '../../theme';
import {Heatmap as HeatmapData, getHeatmap, localDay} from '../api';
import {STREAK} from '../content';
import Heatmap, {HeatmapLegend} from '../components/Heatmap';
import Screen from '../components/Screen';

/** The whole year of good-moment days, scrolled sideways, months named. */
export default function YearScreen({onBack, onOpenDay}: {onBack: () => void; onOpenDay: (date: string) => void}) {
  const [heat, setHeat] = useState<HeatmapData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date();
    const monday = -((today.getDay() + 6) % 7);
    getHeatmap(localDay(monday - 7 * 51, today), localDay(0, today))
      .then(setHeat)
      .catch(e => setError((e as Error).message));
  }, []);

  return (
    <Screen title="Your year" onBack={onBack}>
      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : null}
      {!heat && !error ? <ActivityIndicator color={colors.accent} style={{marginTop: 40}} /> : null}
      {heat ? (
        <>
          <Text style={{...type.small, marginBottom: 14}}>
            {STREAK.best(heat.streak.best)} · {STREAK.total(heat.streak.total_days)}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentOffset={{x: 10000, y: 0}}>
            <Heatmap days={heat.days} monthLabels cell={13} onDayPress={onOpenDay} />
          </ScrollView>
          <View style={{marginTop: 10}}>
            <HeatmapLegend less={STREAK.less} more={STREAK.more} />
          </View>
          {heat.days.some(d => d.grace_day) ? <Text style={{...type.tiny, marginTop: 8}}>{STREAK.grace}</Text> : null}
        </>
      ) : null}
    </Screen>
  );
}
