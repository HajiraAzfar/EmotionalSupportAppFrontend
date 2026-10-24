import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, Text, View} from 'react-native';
import {Heart} from 'lucide-react-native';

import Screen, {LinkRow} from '../../components/ModuleScreen';
import {colors, type} from '../../theme';
import {ThoughtRecord, deleteRecord, getRecord, setFavorite} from '../api';
import {DONE, HISTORY, RECORD} from '../content';
import {shortDate} from '../../savoring/components/MomentCard';

function Line({label, value}: {label: string; value: string | null | undefined}) {
  if (!value) {
    return null;
  }
  return (
    <View style={{borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 10}}>
      <Text style={type.tiny}>{label.toUpperCase()}</Text>
      <Text style={{...type.body, color: colors.ink, marginTop: 2}}>{value}</Text>
    </View>
  );
}

const pct = (v: number | null) => (v === null ? null : `${v}%`);

/** One record as she wrote it (a record from before reads the same way): to read, keep, change or delete. */
export default function RecordScreen({id, onBack, onEdit}: {id: string; onBack: () => void; onEdit: (r: ThoughtRecord) => void}) {
  const [record, setRecord] = useState<ThoughtRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getRecord(id)
      .then(setRecord)
      .catch(e => setError((e as Error).message));
  }, [id]);

  if (!record) {
    return (
      <Screen onBack={onBack}>
        {error ? (
          <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
        )}
      </Screen>
    );
  }

  function remove() {
    Alert.alert(RECORD.removeTitle, RECORD.removeBody, [
      {text: RECORD.keep, style: 'cancel'},
      {
        text: RECORD.remove,
        style: 'destructive',
        onPress: async () => {
          await deleteRecord(record!.id).catch(() => undefined);
          onBack();
        },
      },
    ]);
  }

  const belief =
    record.belief_before !== null && record.belief_after !== null ? DONE.belief(record.belief_before, record.belief_after) : null;
  return (
    <Screen
      onBack={onBack}
      right={
        <Pressable
          onPress={async () => setRecord(await setFavorite(record.id, !record.is_favorite).catch(() => record))}
          hitSlop={12}
          accessibilityRole="switch"
          accessibilityState={{checked: record.is_favorite}}
          accessibilityLabel={DONE.favorite}>
          <Heart size={20} color={colors.alert} fill={record.is_favorite ? colors.alert : 'transparent'} />
        </Pressable>
      }>
      <Text style={type.tiny}>
        {shortDate(record.local_date)}
        {record.edited_at ? ` · ${HISTORY.edited.toUpperCase()}` : ''}
      </Text>
      <Text accessibilityRole="header" style={{...type.title, marginTop: 6}}>
        “{record.automatic_thought ?? record.name}”
      </Text>
      {belief ? <Text style={{...type.heading, marginTop: 10}}>{belief}</Text> : null}
      <View style={{marginTop: 16}}>
        <Line label="What was happening" value={record.situation} />
        <Line label="About" value={record.situation_tags.map(t => t.name).join(', ')} />
        <Line
          label="Feelings"
          value={record.emotions
            .map(e => (e.before !== null && e.after !== null ? `${e.name} ${e.before} → ${e.after}` : e.before !== null ? `${e.name} ${e.before}` : e.name))
            .join(', ')}
        />
        <Line label="A second thought" value={record.second_thought} />
        <Line label="Thinking patterns" value={record.thinking_traps.map(t => t.name).join(', ')} />
        <Line label="What makes it feel true" value={record.evidence_for} />
        <Line label="What doesn't quite fit" value={record.evidence_against} />
        <Line label="How you would put it now" value={record.balanced_thought} />
        <Line label="Believing that" value={pct(record.balanced_belief)} />
        <Line label="Next step" value={record.next_step} />
      </View>
      <View style={{flexDirection: 'row', gap: 24, marginTop: 18}}>
        <LinkRow label={RECORD.edit} onPress={() => onEdit(record)} />
        <Pressable onPress={remove} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
          <Text style={{...type.link, color: colors.alert}}>{RECORD.remove}</Text>
        </Pressable>
      </View>
      {!record.editable_freely ? <Text style={{...type.tiny, marginTop: 4}}>{RECORD.editLater}</Text> : null}
    </Screen>
  );
}
