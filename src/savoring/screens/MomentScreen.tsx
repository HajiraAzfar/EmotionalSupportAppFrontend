import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, Text, View} from 'react-native';
import {Heart} from 'lucide-react-native';

import PrimaryButton from '../../components/PrimaryButton';
import {colors, type} from '../../theme';
import {Moment, deleteMoment, getMoment, setActual, setFavorite} from '../api';
import {DONE, ENTRY, FOLLOW_UP, TYPES} from '../content';
import {moodChange, shortDate} from '../components/MomentCard';
import ScoreScale from '../components/ScoreScale';
import Screen, {Card, LinkRow} from '../components/Screen';

type Props = {
  id: string;
  onBack: () => void;
  onEdit: (moment: Moment) => void;
};

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

/** One moment, as she put it down: to read again, keep as a favourite, edit or delete. */
export default function MomentScreen({id, onBack, onEdit}: Props) {
  const [moment, setMoment] = useState<Moment | null>(null);
  const [error, setError] = useState('');
  const [actual, setActualValue] = useState<number | null>(null);

  const load = useCallback(() => {
    getMoment(id)
      .then(setMoment)
      .catch(e => setError((e as Error).message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!moment) {
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

  const kind = TYPES.find(t => t.id === moment.type);
  const change = moodChange(moment);

  function remove() {
    Alert.alert(ENTRY.removeTitle, ENTRY.removeBody, [
      {text: ENTRY.keep, style: 'cancel'},
      {
        text: ENTRY.remove,
        style: 'destructive',
        onPress: async () => {
          await deleteMoment(moment!.id).catch(() => undefined);
          onBack();
        },
      },
    ]);
  }

  return (
    <Screen
      onBack={onBack}
      right={
        <Pressable
          onPress={async () => setMoment(await setFavorite(moment.id, !moment.is_favorite).catch(() => moment))}
          hitSlop={12}
          accessibilityRole="switch"
          accessibilityState={{checked: moment.is_favorite}}
          accessibilityLabel={DONE.favorite}>
          <Heart size={20} color={colors.alert} fill={moment.is_favorite ? colors.alert : 'transparent'} />
        </Pressable>
      }>
      <Text style={type.tiny}>
        {shortDate(moment.local_date)} · {kind?.chip.toUpperCase()}
      </Text>
      <Text accessibilityRole="header" style={{...type.title, marginTop: 6}}>
        {moment.what_happened}
      </Text>
      {change ? <Text style={{...type.heading, marginTop: 10}}>{`${DONE.mood}: ${change}`}</Text> : null}

      <View style={{marginTop: 16}}>
        <Line label="About" value={moment.categories.map(c => c.name).join(', ')} />
        <Line label="Who" value={moment.people.join(', ')} />
        <Line label="Where" value={moment.places.join(', ')} />
        <Line
          label="Feelings"
          value={moment.emotions.map(e => (e.intensity !== null ? `${e.name} (${e.intensity}/10)` : e.name)).join(', ')}
        />
        <Line label="In the moment" value={moment.sensory_note} />
        <Line label="What you did" value={moment.techniques.map(t => t.name).join(', ')} />
        <Line label="What made it good" value={moment.why_good} />
        <Line label="Souvenir line" value={moment.souvenir_line ? `“${moment.souvenir_line}”` : null} />
        <Line label="When" value={moment.event_date ? shortDate(moment.event_date) : null} />
        <Line
          label="Expected and real"
          value={
            moment.expected_rating !== null && moment.actual_rating !== null
              ? ENTRY.expectedActual(moment.expected_rating, moment.actual_rating)
              : moment.expected_rating !== null
                ? FOLLOW_UP.expected(moment.expected_rating)
                : null
          }
        />
      </View>

      {moment.follow_up_due ? (
        <Card tint={colors.sageWash}>
          <Text style={{...type.heading, marginBottom: 10}}>{FOLLOW_UP.title}</Text>
          <ScoreScale value={actual} onChange={setActualValue} label={FOLLOW_UP.title} low="Not good" high="As good as it gets" />
          <View style={{marginTop: 10}}>
            <PrimaryButton
              label={FOLLOW_UP.save}
              disabled={actual === null}
              onPress={async () => setMoment(await setActual(moment.id, actual!).catch(() => moment))}
            />
          </View>
        </Card>
      ) : null}

      <View style={{flexDirection: 'row', gap: 24, marginTop: 22}}>
        <LinkRow label={ENTRY.edit} onPress={() => onEdit(moment)} />
        <Pressable onPress={remove} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
          <Text style={{...type.link, color: colors.alert}}>{ENTRY.remove}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
