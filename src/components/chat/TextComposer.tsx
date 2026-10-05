import React, {useState} from 'react';
import {ActivityIndicator, Pressable, Text, TextInput, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {colors, radius, type} from '../../theme';
import {MicButton, RecordingBar, useVoiceNote} from './VoiceNote';

type Props = {
  busy: boolean;
  placeholder?: string;
  maxLength?: number;
  onSend: (text: string) => void;
  // Optional capture values show a Skip control (FR-ENT-024 "explicit skip").
  onSkip?: () => void;
  // Shows the mic: she can speak instead of typing, and checks the text before it is sent.
  voice?: boolean;
  // AI Chat: a voice message is sent as soon as it is turned into text, like a
  // voice note, with anything already typed in front of it.
  voiceSends?: boolean;
};

// A paper plane, drawn to match the mic: outline only, round joins.
function SendIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 3 3 10.5l7 2.5 2.5 7.5L21 3ZM10 13l11-10"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TextComposer({
  busy,
  placeholder,
  maxLength,
  onSend,
  onSkip,
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
                borderRadius: radius.card,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: colors.ink,
                fontSize: 15,
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
                backgroundColor: canSend ? colors.forest : colors.sage,
                borderRadius: radius.pill,
              }}>
              {busy ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <SendIcon color={colors.onAccent} />
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

      {onSkip && (
        <Pressable onPress={onSkip} disabled={busy || speaking} style={{paddingTop: 10}}>
          <Text style={{...type.small, textAlign: 'center'}}>Skip</Text>
        </Pressable>
      )}
    </View>
  );
}
