import React, {useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {signupEmail} from '../api/auth';
import {colors, space, type} from '../theme';

type Props = {
  onCodeSent: (email: string) => void;
  onGoToLogin: () => void;
};

export default function SignupScreen({onCodeSent, onGoToLogin}: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setBusy(true);

    try {
      await signupEmail(email.trim());
      onCodeSent(email.trim());
    } catch (e) {
      const message = (e as Error).message;
      setError(message);

      if (message.includes('already exists')) {
        // Account already registered — nudge toward sign in instead of
        // pretending a code was sent.
      }
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
          <Text style={type.title}>Create your account</Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 36}}>
            We will send a verification code to your email.
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
            <PrimaryButton label="Send code" onPress={handleContinue} busy={busy} />
          </View>

          <View style={{flex: 1}} />

          <Pressable onPress={onGoToLogin} style={{paddingVertical: 16}}>
            <Text style={{...type.link, textAlign: 'center'}}>
              I already have an account
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}