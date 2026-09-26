import React, {useState} from 'react';
import {ActivityIndicator, Pressable, Text, TextInput, View} from 'react-native';

import {colors, radius, type} from '../../theme';

type Props = {
  busy: boolean;
  placeholder?: string;
  maxLength?: number;
  onSend: (text: string) => void;
  // Optional capture values show a Skip control (FR-ENT-024 "explicit skip").
  onSkip?: () => void;
  // Free write: she can keep sending messages, then say she is done.
  onDone?: () => void;
  doneLabel?: string;
};

export default function TextComposer({busy, placeholder, maxLength, onSend, onSkip, onDone, doneLabel}: Props) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !busy;

  function send() {
    if (!canSend) {
      return;
    }
    onSend(text.trim());
    setText('');
  }

  return (
    <View>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8}}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder ?? 'Write here…'}
          placeholderTextColor={colors.inkFaint}
          maxLength={maxLength}
          multiline
          editable={!busy}
          style={{
            flex: 1,
            maxHeight: 140,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.card,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: colors.ink,
            fontSize: 15,
          }}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          style={{
            backgroundColor: canSend ? colors.forest : colors.sage,
            borderRadius: radius.pill,
            paddingHorizontal: 18,
            paddingVertical: 12,
          }}>
          {busy ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={{...type.label, color: colors.surface}}>Send</Text>
          )}
        </Pressable>
      </View>

      {onSkip && (
        <Pressable onPress={onSkip} disabled={busy} style={{paddingTop: 10}}>
          <Text style={{...type.small, textAlign: 'center'}}>Skip</Text>
        </Pressable>
      )}

      {onDone && (
        <Pressable onPress={onDone} disabled={busy} style={{paddingTop: 10}}>
          <Text style={{...type.small, textAlign: 'center', color: colors.forest}}>
            {doneLabel ?? "I'm done writing"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
