import React from 'react';
import {Text, View} from 'react-native';

import {EntryMessage} from '../../api/entries';
import {colors, gradient, radius, shadow, type} from '../../theme';

type Props = {
  message: EntryMessage;
};

// The user's in the primary gradient on the right; Echo's on white on the left.
export default function MessageBubble({message}: Props) {
  const mine = message.role === 'user';
  const isCrisis = message.kind === 'crisis';
  const isNotice = message.kind === 'notice';
  const isGrounding = message.kind === 'grounding';
  // A suggestion Echo offered, not something she wrote and not a conclusion
  // about her. Reading the entry back weeks later, the line still has to say
  // whose words these were.
  const isSuggestion = message.kind === 'perspective';

  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        ...(mine
          ? {backgroundImage: gradient.primary}
          : {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: isCrisis ? colors.alert : isGrounding ? colors.sage : colors.line,
            }),
        ...shadow.sm,
        borderRadius: radius.card,
        borderBottomRightRadius: mine ? radius.tail : radius.card,
        borderBottomLeftRadius: mine ? radius.card : radius.tail,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 10,
      }}>
      {isSuggestion && (
        <Text style={{...type.tiny, marginBottom: 4}}>
          ECHO'S SUGGESTION — YOURS TO KEEP OR LEAVE
        </Text>
      )}
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
