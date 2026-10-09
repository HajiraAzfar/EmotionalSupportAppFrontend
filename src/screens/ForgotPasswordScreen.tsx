import React, {useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {forgotPassword} from '../api/auth';
import {colors, space, type} from '../theme';

type Props = {
  onCodeSent: (email: string) => void;
  onBack: () => void;
};

export default function ForgotPasswordScreen({onCodeSent, onBack}: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setError('');
    setBusy(true);

    try {
      await forgotPassword(email.trim());
      onCodeSent(email.trim());
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
          <Text style={type.title}>Reset your password</Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 36}}>
            Enter your email and we will send you a code.
          </Text>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            email
          />

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginBottom: 16}}>
              {error}
            </Text>
          ) : null}

          <View style={{marginTop: 8}}>
            <PrimaryButton label="Send code" onPress={handleSend} busy={busy} />
          </View>

          <View style={{flex: 1}} />

          <Pressable onPress={onBack} style={{paddingVertical: 16}}>
            <Text style={{...type.link, textAlign: 'center'}}>
              Back to sign in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}