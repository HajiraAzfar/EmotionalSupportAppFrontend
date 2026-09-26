import React from 'react';
import {Text, View} from 'react-native';

import {EntryMessage} from '../../api/entries';
import {colors, radius, type} from '../../theme';

type Props = {
  message: EntryMessage;
};

export default function MessageBubble({message}: Props) {
  const mine = message.role === 'user';
  const isCrisis = message.kind === 'crisis';
  const isNotice = message.kind === 'notice';
  const isGrounding = message.kind === 'grounding';

  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        backgroundColor: mine ? colors.forest : colors.surface,
        borderWidth: mine ? 0 : 1,
        borderColor: isCrisis ? colors.alert : isGrounding ? colors.sage : colors.line,
        borderRadius: radius.card,
        borderBottomRightRadius: mine ? 4 : radius.card,
        borderBottomLeftRadius: mine ? radius.card : 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 10,
      }}>
      <Text
        style={{
          ...type.body,
          color: mine ? colors.surface : isNotice ? colors.inkFaint : colors.ink,
          fontStyle: isNotice ? 'italic' : 'normal',
        }}>
        {message.content}
      </Text>
    </View>
  );
}
