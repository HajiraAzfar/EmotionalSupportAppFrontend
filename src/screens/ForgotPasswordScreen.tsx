import React, {useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import {apiRequest} from '../api/client';
import {colors, space, type} from '../theme';

type Props = {
  onBack: () => void;
};

export default function ForgotPasswordScreen({onBack}: Props) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setError('');
    setBusy(true);

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: {email: email.trim()},
      });
      setSent(true);
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
          {sent ? (
            <>
              <Text style={type.title}>Check your email</Text>
              <Text style={{...type.body, marginTop: 10}}>
                If an account exists for that address, we have sent a link to
                reset your password. The link expires in one hour.
              </Text>
            </>
          ) : (
            <>
              <Text style={type.title}>Reset your password</Text>
              <Text style={{...type.body, marginTop: 10, marginBottom: 36}}>
                Enter your email and we will send you a link.
              </Text>

              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                email
              />

              {error ? (
                <Text
                  style={{...type.small, color: colors.alert, marginBottom: 16}}>
                  {error}
                </Text>
              ) : null}

              <View style={{marginTop: 8}}>
                <PrimaryButton
                  label="Send reset link"
                  onPress={handleSend}
                  busy={busy}
                />
              </View>
            </>
          )}

          <View style={{flex: 1}} />

          <Pressable onPress={onBack} style={{paddingVertical: 16}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              Back to sign in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}