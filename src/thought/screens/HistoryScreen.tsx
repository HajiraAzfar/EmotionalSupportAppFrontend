import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import Chip from '../../components/chat/Chip';
import Screen from '../../components/ModuleScreen';
import {colors, type} from '../../theme';
import {ThoughtRecord, listRecords} from '../api';
import {HISTORY} from '../content';
import {shortDate} from '../../savoring/components/MomentCard';
import {RecordCard} from './ThoughtHome';

/** Finished records, newest first, filtered by what they were about, a pattern, favourites or a day. */
export default function HistoryScreen({onBack, onOpenRecord, date: initialDate}: {
  onBack: () => void;
  onOpenRecord: (id: string) => void;
  date?: string;
}) {
  const [records, setRecords] = useState<ThoughtRecord[] | null>(null);
  const [error, setError] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [trap, setTrap] = useState<string | null>(null);
  const [favorites, setFavorites] = useState(false);
  const [date, setDate] = useState(initialDate ?? null);

  useEffect(() => {
    listRecords()
      .then(setRecords)
      .catch(e => setError((e as Error).message));
  }, []);

  // The tags and patterns she has used, as filters.
  const filters = useMemo(() => {
    const tags = new Map<string, string>();
    const traps = new Map<string, string>();
    for (const r of records ?? []) {
      r.situation_tags.forEach(t => tags.set(t.id, t.name));
      r.thinking_traps.forEach(t => traps.set(t.id, t.name));
    }
    return {tags: [...tags], traps: [...traps].slice(0, 6)};
  }, [records]);

  const shown = (records ?? []).filter(
    r =>
      (!tag || r.situation_tags.some(t => t.id === tag)) &&
      (!trap || r.thinking_traps.some(t => t.id === trap)) &&
      (!favorites || r.is_favorite) &&
      (!date || r.local_date === date),
  );

  return (
    <Screen title={HISTORY.title} onBack={onBack}>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
        <Chip label={HISTORY.favorites} on={favorites} onPress={() => setFavorites(v => !v)} />
        {filters.tags.map(([id, name]) => (
          <Chip key={id} label={name} on={tag === id} onPress={() => setTag(tag === id ? null : id)} />
        ))}
      </View>
      {filters.traps.length ? (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
          {filters.traps.map(([id, name]) => (
            <Chip key={id} label={name} on={trap === id} onPress={() => setTrap(trap === id ? null : id)} />
          ))}
        </View>
      ) : null}
      {date ? (
        <View style={{flexDirection: 'row', marginTop: 8}}>
          <Chip label={shortDate(date)} on removable onPress={() => setDate(null)} />
        </View>
      ) : null}
      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : null}
      {!records && !error ? <ActivityIndicator color={colors.accent} style={{marginTop: 40}} /> : null}
      {records && !shown.length ? <Text style={{...type.body, marginTop: 24}}>{HISTORY.empty}</Text> : null}
      <View style={{marginTop: 16}}>
        {shown.map(r => (
          <RecordCard key={r.id} record={r} onPress={() => onOpenRecord(r.id)} />
        ))}
      </View>
    </Screen>
  );
}
