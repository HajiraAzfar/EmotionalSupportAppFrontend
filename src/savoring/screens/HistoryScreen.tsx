import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import Chip from '../../components/chat/Chip';
import {colors, type} from '../../theme';
import {Moment, MomentType, listMoments, localDay} from '../api';
import {HISTORY, TYPES} from '../content';
import MomentCard, {shortDate} from '../components/MomentCard';
import Screen from '../components/Screen';

type Props = {
  onBack: () => void;
  onOpenMoment: (id: string) => void;
  // Opened from a heatmap day: that day only, until she clears it.
  date?: string;
};

const mondayOf = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  return localDay(-((day.getDay() + 6) % 7), day);
};

// "This week", "Last week", or "13 Oct – 19 Oct".
function weekLabel(monday: string) {
  const thisWeek = mondayOf(localDay());
  if (monday === thisWeek) {
    return HISTORY.thisWeek;
  }
  if (monday === localDay(-7, new Date(`${thisWeek}T00:00:00`))) {
    return HISTORY.lastWeek;
  }
  return `${shortDate(monday)} – ${shortDate(localDay(6, new Date(`${monday}T00:00:00`)))}`;
}

/** Every moment, newest first, a group per week; filter by kind, feeling, favourites or one day. */
export default function HistoryScreen({onBack, onOpenMoment, date: initialDate}: Props) {
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<MomentType | null>(null);
  const [favorites, setFavorites] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [date, setDate] = useState(initialDate ?? null);

  useEffect(() => {
    listMoments()
      .then(setMoments)
      .catch(e => setError((e as Error).message));
  }, []);

  // The feelings she has named, most named first, as filters.
  const feelings = useMemo(() => {
    const counted = new Map<string, {name: string; n: number}>();
    for (const m of moments ?? []) {
      for (const e of m.emotions) {
        counted.set(e.id, {name: e.name, n: (counted.get(e.id)?.n ?? 0) + 1});
      }
    }
    return [...counted.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 6);
  }, [moments]);

  const shown = (moments ?? []).filter(
    m =>
      (!kind || m.type === kind) &&
      (!favorites || m.is_favorite) &&
      (!emotion || m.emotions.some(e => e.id === emotion)) &&
      (!date || m.local_date === date),
  );
  const weeks: [string, Moment[]][] = [];
  for (const m of shown) {
    const monday = mondayOf(m.local_date);
    const group = weeks.find(([w]) => w === monday);
    if (group) {
      group[1].push(m);
    } else {
      weeks.push([monday, [m]]);
    }
  }

  return (
    <Screen title={HISTORY.title} onBack={onBack}>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
        <Chip label={HISTORY.all} on={!kind} onPress={() => setKind(null)} />
        {TYPES.map(t => (
          <Chip key={t.id} label={t.chip} on={kind === t.id} onPress={() => setKind(kind === t.id ? null : t.id)} />
        ))}
        <Chip label={HISTORY.favorites} on={favorites} onPress={() => setFavorites(v => !v)} />
      </View>
      {feelings.length ? (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
          {feelings.map(([id, f]) => (
            <Chip key={id} label={f.name} on={emotion === id} onPress={() => setEmotion(emotion === id ? null : id)} />
          ))}
        </View>
      ) : null}
      {date ? (
        <View style={{flexDirection: 'row', marginTop: 8}}>
          <Chip label={shortDate(date)} on removable onPress={() => setDate(null)} />
        </View>
      ) : null}

      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : null}
      {!moments && !error ? <ActivityIndicator color={colors.accent} style={{marginTop: 40}} /> : null}
      {moments && !shown.length ? <Text style={{...type.body, marginTop: 24}}>{HISTORY.empty}</Text> : null}
      {weeks.map(([monday, list]) => (
        <View key={monday} style={{marginTop: 22}}>
          <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
            {weekLabel(monday)}
          </Text>
          {list.map(m => (
            <MomentCard key={m.id} moment={m} onPress={() => onOpenMoment(m.id)} />
          ))}
        </View>
      ))}
    </Screen>
  );
}
