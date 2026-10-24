import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {Heart} from 'lucide-react-native';

import {colors, radius, type} from '../../theme';
import {Moment} from '../api';
import {TYPES} from '../content';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDate(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function moodChange(moment: Pick<Moment, 'mood_before' | 'mood_after'>) {
  return moment.mood_before !== null && moment.mood_after !== null
    ? `${moment.mood_before} → ${moment.mood_after}`
    : null;
}

// One moment in a list: its day and kind, what happened, the mood change.
export default function MomentCard({moment, onPress}: {moment: Moment; onPress: () => void}) {
  const kind = TYPES.find(t => t.id === moment.type)?.chip ?? '';
  const change = moodChange(moment);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${shortDate(moment.local_date)}, ${kind}: ${moment.what_happened ?? ''}`}
      style={({pressed}) => ({
        padding: 14,
        marginBottom: 8,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
      })}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <Text style={type.tiny}>
          {shortDate(moment.local_date)} · {kind.toUpperCase()}
        </Text>
        <View style={{flex: 1}} />
        {change ? <Text style={type.tiny}>{change}</Text> : null}
        {moment.is_favorite ? <Heart size={14} color={colors.alert} fill={colors.alert} /> : null}
      </View>
      <Text style={{...type.body, color: colors.ink, marginTop: 4}} numberOfLines={2}>
        {moment.what_happened}
      </Text>
      {moment.souvenir_line ? (
        <Text style={{...type.small, marginTop: 4, fontStyle: 'italic'}} numberOfLines={1}>
          “{moment.souvenir_line}”
        </Text>
      ) : null}
    </Pressable>
  );
}
