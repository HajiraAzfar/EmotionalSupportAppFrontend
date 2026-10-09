import React, {useState} from 'react';
import {KeyboardAvoidingView, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {verifyResetCode} from '../api/auth';
import {colors, space, type} from '../theme';

type Props = {
  email: string;
  onVerified: (resetToken: string) => void;
};

export default function VerifyResetCodeScreen({email, onVerified}: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleVerify() {
    setError('');

    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setBusy(true);

    try {
      const data = await verifyResetCode(email, code.trim());
      onVerified(data.reset_token);
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
          <Text style={type.title}>Check your email</Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 36}}>
            Enter the 6-digit code we sent to {email}.
          </Text>

          <Field
            label="Reset code"
            value={code}
            onChangeText={setCode}
            placeholder="000000"
          />

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginBottom: 16}}>
              {error}
            </Text>
          ) : null}

          <View style={{marginTop: 8}}>
            <PrimaryButton label="Verify" onPress={handleVerify} busy={busy} />
          </View>

          <View style={{flex: 1}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}