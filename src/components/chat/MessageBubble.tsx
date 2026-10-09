import React from 'react';
import {Text, View} from 'react-native';

import {EntryMessage} from '../../api/entries';
import {colors, gradient, radius, shadow, type} from '../../theme';

type Props = {
  message: EntryMessage;
};

// Hers in the violet gradient on the right; Echo's on frosted glass on the left.
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
        ...(mine
          ? {backgroundImage: gradient.primary}
          : {
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: isCrisis ? colors.alert : isGrounding ? colors.sage : colors.glassEdge,
            }),
        ...shadow.sm,
        borderRadius: radius.card,
        borderBottomRightRadius: mine ? radius.tail : radius.card,
        borderBottomLeftRadius: mine ? radius.card : radius.tail,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 10,
      }}>
      <Text
        style={{
          ...type.body,
          color: mine ? colors.onAccent : isNotice ? colors.inkFaint : colors.ink,
          fontStyle: isNotice ? 'italic' : 'normal',
        }}>
        {message.content}
      </Text>
    </View>
  );
}
