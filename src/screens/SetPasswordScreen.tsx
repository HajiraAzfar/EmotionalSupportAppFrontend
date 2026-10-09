import React, {useState} from 'react';
import {KeyboardAvoidingView, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {saveTokens} from '../storage/tokens';
import {colors, space, type} from '../theme';

type Props = {
  title: string;
  submit: (password: string) => Promise<{access_token: string; refresh_token: string}>;
  onDone: () => void;
};

export default function SetPasswordScreen({title, submit, onDone}: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError('');

    if (password.length < 8) {
      setError('Your password needs to be at least 8 characters.');
      return;
    }

    setBusy(true);

    try {
      const data = await submit(password);
      await saveTokens(data.access_token, data.refresh_token);
      onDone();
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
          <Text style={type.title}>{title}</Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 36}}>
            Choose a password with at least 8 characters.
          </Text>

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secure
          />

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginBottom: 16}}>
              {error}
            </Text>
          ) : null}

          <View style={{marginTop: 8}}>
            <PrimaryButton label="Continue" onPress={handleSubmit} busy={busy} />
          </View>

          <View style={{flex: 1}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}