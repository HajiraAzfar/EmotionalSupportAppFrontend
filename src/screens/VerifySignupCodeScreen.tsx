import React, {useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import {signupEmail, verifySignupCode} from '../api/auth';
import {colors, space, type} from '../theme';

type Props = {
  email: string;
  onVerified: (setupToken: string) => void;
  onBack: () => void;
};

export default function VerifySignupCodeScreen({email, onVerified, onBack}: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleVerify() {
    setError('');

    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setBusy(true);

    try {
      const data = await verifySignupCode(email, code.trim());
      onVerified(data.setup_token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError('');
    setResent(false);
    setBusy(true);

    try {
      await signupEmail(email);
      setResent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
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
            label="Verification code"
            value={code}
            onChangeText={setCode}
            placeholder="000000"
          />

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginBottom: 16}}>
              {error}
            </Text>
          ) : null}

          {resent ? (
            <Text style={{...type.small, marginBottom: 16}}>
              A new code has been sent.
            </Text>
          ) : null}

          <View style={{marginTop: 8}}>
            <PrimaryButton label="Verify" onPress={handleVerify} busy={busy} />
          </View>

          <Pressable onPress={handleResend} style={{paddingVertical: 16}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              Didn't get a code? Resend
            </Text>
          </Pressable>

          <View style={{flex: 1}} />

          <Pressable onPress={onBack} style={{paddingVertical: 16}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              Use a different email
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}