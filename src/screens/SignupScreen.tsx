import React, {useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import {signup} from '../api/auth';
import {saveTokens} from '../storage/tokens';
import {colors, space, type} from '../theme';

type Props = {
  onSignedIn: () => void;
  onGoToLogin: () => void;
};

export default function SignupScreen({onSignedIn, onGoToLogin}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSignup() {
    setError('');

    if (password.length < 8) {
      setError('Your password needs to be at least 8 characters.');
      return;
    }

    setBusy(true);

    try {
      const data = await signup(email.trim(), password);
      await saveTokens(data.access_token, data.refresh_token);
      onSignedIn();
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
          <Text style={type.title}>Create your account</Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 36}}>
            Your entries stay private to you.
          </Text>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            email
          />

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
            <PrimaryButton label="Create account" onPress={handleSignup} busy={busy} />
          </View>

          <View style={{flex: 1}} />

          <Pressable onPress={onGoToLogin} style={{paddingVertical: 16}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              I already have an account
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}