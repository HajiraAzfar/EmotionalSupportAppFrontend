import React, {useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Field from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import {login} from '../api/auth';
import {saveTokens} from '../storage/tokens';
import {colors, space, type} from '../theme';

type Props = {
  onSignedIn: () => void;
  onGoToSignup: () => void;
  onGoToForgot: () => void;
};

export default function LoginScreen({
  onSignedIn,
  onGoToSignup,
  onGoToForgot,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setError('');
    setBusy(true);

    try {
      const data = await login(email.trim(), password);
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
          <Text style={type.title}>Welcome back</Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 36}}>
            Pick up where you left off.
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
            placeholder="Your password"
            secure
          />

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginBottom: 16}}>
              {error}
            </Text>
          ) : null}

          <View style={{marginTop: 8}}>
            <PrimaryButton label="Sign in" onPress={handleLogin} busy={busy} />
          </View>

          <Pressable onPress={onGoToForgot} style={{paddingVertical: 14}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              Forgot your password?
            </Text>
          </Pressable>

          <View style={{flex: 1}} />

          <Pressable onPress={onGoToSignup} style={{paddingVertical: 16}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              Create an account
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}