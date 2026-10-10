import React, {useState} from 'react';
import {ActivityIndicator, Pressable, Text, TextInput, View} from 'react-native';
import {SendHorizontal} from 'lucide-react-native';

import {colors, gradient, radius, shadow, type} from '../../theme';
import {MicButton, RecordingBar, useVoiceNote} from './VoiceNote';

type Props = {
  busy: boolean;
  placeholder?: string;
  maxLength?: number;
  onSend: (text: string) => void;
  // Optional capture values: with nothing written, Continue sends an empty answer.
  // There is no Skip control, and nothing comments on an empty answer.
  allowEmpty?: boolean;
  // Shows the mic: she can speak instead of typing, and checks the text before it is sent.
  voice?: boolean;
  // AI Chat: a voice message is sent as soon as it is turned into text, like a
  // voice note, with anything already typed in front of it.
  voiceSends?: boolean;
};

export default function TextComposer({
  busy,
  placeholder,
  maxLength,
  onSend,
  allowEmpty = false,
  voice = false,
  voiceSends = false,
}: Props) {
  const [text, setText] = useState('');
  // Set when spoken words were just added, so she knows to read them over first.
  const [heard, setHeard] = useState(false);
  const recorder = useVoiceNote(spoken => {
    const joined = text.trim() ? `${text.trimEnd()} ${spoken}` : spoken;
    const message = maxLength ? joined.slice(0, maxLength) : joined;
    if (voiceSends) {
      setText('');
      onSend(message);
      return;
    }
    setText(message);
    setHeard(true);
  });
  const speaking = recorder.phase !== 'idle';
  const canSend = text.trim().length > 0 && !busy && !speaking;

  function send() {
    if (!canSend) {
      return;
    }
    const written = text.trim();
    setText('');
    setHeard(false);
    onSend(written);
  }

  return (
    <View>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8}}>
        {speaking ? (
          <RecordingBar
            phase={recorder.phase}
            seconds={recorder.seconds}
            onCancel={recorder.cancel}
            onDone={recorder.finish}
          />
        ) : (
          <>
            <TextInput
              value={text}
              onChangeText={value => {
                setText(value);
                recorder.clearError();
                if (!value) {
                  setHeard(false);
                }
              }}
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
                borderRadius: radius.image,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: colors.ink,
                ...type.input,
                ...shadow.sm,
              }}
            />
            {voice && <MicButton disabled={busy} onPress={recorder.start} />}
            <Pressable
              onPress={send}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send"
              hitSlop={6}
              style={{
                width: 46,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                ...(canSend
                  ? {backgroundImage: gradient.primary, ...shadow.button}
                  : {backgroundColor: colors.accentSoft}),
                borderRadius: radius.pill,
              }}>
              {busy ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <SendHorizontal size={20} color={colors.onAccent} />
              )}
            </Pressable>
          </>
        )}
      </View>

      {recorder.error ? (
        <Text style={{...type.small, color: colors.alert, paddingTop: 8}}>{recorder.error}</Text>
      ) : heard && !speaking ? (
        <Text style={{...type.small, paddingTop: 8}}>
          This is what I heard. Change anything that's not right, then send.
        </Text>
      ) : null}

      {allowEmpty && !text.trim() && !speaking && (
        <Pressable onPress={() => onSend('')} disabled={busy} style={{paddingTop: 12}} accessibilityRole="button">
          <Text style={{...type.link, textAlign: 'center'}}>Continue</Text>
        </Pressable>
      )}
    </View>
  );
}
