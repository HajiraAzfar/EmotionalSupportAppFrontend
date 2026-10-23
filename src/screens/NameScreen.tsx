import React, {useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {setPreferredName} from '../api/auth';
import {colors, radius, shadow, space, type} from '../theme';

const MAX_LENGTH = 40;

type Props = {
  // The name already set, when changing it from Settings.
  initial?: string | null;
  // Onboarding asks once and can be passed; Settings changes or clears it.
  mode: 'onboarding' | 'settings';
  onDone: (name: string | null) => void;
  onCancel?: () => void;
};

// What the user would like to be called. Only the greeting uses it.
export default function NameScreen({initial, mode, onDone, onCancel}: Props) {
  const [text, setText] = useState(initial ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onboarding = mode === 'onboarding';

  async function save() {
    if (onboarding && !text.trim()) {
      onDone(null);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const status = await setPreferredName(text.trim());
      onDone(status?.preferred_name ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: space.screen,
            paddingTop: 40,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={type.title}>
            {onboarding ? 'What would you like us to call you?' : 'Your name'}
          </Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 28}}>
            It is only used to greet you on the home screen. A nickname is fine, and so is
            leaving it empty.
          </Text>

          <TextInput
            value={text}
            onChangeText={value => value.length <= MAX_LENGTH && setText(value)}
            placeholder="Your name"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Your name"
            autoCapitalize="words"
            autoComplete="given-name"
            returnKeyType="done"
            onSubmitEditing={save}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.input,
              paddingHorizontal: 16,
              paddingVertical: 15,
              ...type.input,
              color: colors.ink,
              ...shadow.sm,
            }}
          />

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginTop: 12}}>{error}</Text>
          ) : null}

          <View style={{flex: 1, minHeight: 24}} />

          <PrimaryButton label={onboarding ? 'Continue' : 'Save'} onPress={save} busy={busy} />

          {onboarding ? (
            <Pressable onPress={() => onDone(null)} style={{paddingVertical: 16}}>
              <Text style={{...type.link, textAlign: 'center'}}>Not now</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onCancel} style={{paddingVertical: 16}}>
              <Text style={{...type.link, textAlign: 'center'}}>Cancel</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
