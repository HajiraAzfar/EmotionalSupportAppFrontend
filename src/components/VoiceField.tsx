import React from 'react';
import {Text, TextInput, View} from 'react-native';

import {MicButton, RecordingBar, useVoiceNote} from './chat/VoiceNote';
import {colors, radius, type} from '../theme';

const inputStyle = {
  ...type.input,
  flex: 1,
  color: colors.ink,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.input,
  padding: 14,
  minHeight: 90,
  textAlignVertical: 'top' as const,
};

// A text answer she can also speak; spoken words are added to what is there.
export default function VoiceField({
  value,
  onChange,
  label,
  placeholder,
  maxLength = 2000,
}: {
  value: string | null;
  onChange: (text: string) => void;
  label: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const recorder = useVoiceNote(spoken => {
    const joined = value?.trim() ? `${value.trimEnd()} ${spoken}` : spoken;
    onChange(joined.slice(0, maxLength));
  });
  if (recorder.phase !== 'idle') {
    return <RecordingBar phase={recorder.phase} seconds={recorder.seconds} onCancel={recorder.cancel} onDone={recorder.finish} />;
  }
  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8}}>
        <TextInput
          value={value ?? ''}
          onChangeText={text => {
            onChange(text);
            recorder.clearError();
          }}
          multiline
          maxLength={maxLength}
          placeholder={placeholder ?? 'However you want to put it.'}
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={label}
          style={inputStyle}
        />
        <MicButton disabled={false} onPress={recorder.start} />
      </View>
      {recorder.error ? <Text style={{...type.small, color: colors.alert, marginTop: 8}}>{recorder.error}</Text> : null}
    </>
  );
}

