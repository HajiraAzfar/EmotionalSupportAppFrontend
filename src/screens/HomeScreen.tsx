import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Button, SafeAreaView, Text, View} from 'react-native';

import {getMe} from '../api/auth';
import {clearTokens, getAccessToken} from '../storage/tokens';

type Props = {
  onSignedOut: () => void;
};

export default function HomeScreen({onSignedOut}: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAccount() {
      try {
        const token = await getAccessToken();
        if (!token) {
          onSignedOut();
          return;
        }
        const account = await getMe(token);
        setEmail(account.email);
      } catch (e) {
        setError((e as Error).message);
      }
    }

    loadAccount();
  }, [onSignedOut]);

  async function handleSignOut() {
    await clearTokens();
    onSignedOut();
  }

  return (
    <SafeAreaView>
      <View style={{padding: 24}}>
        <Text style={{fontSize: 24, marginBottom: 16}}>Signed in</Text>

        {error ? (
          <Text style={{color: 'crimson'}}>{error}</Text>
        ) : email ? (
          <Text style={{fontSize: 16, marginBottom: 24}}>{email}</Text>
        ) : (
          <ActivityIndicator />
        )}

        <Button title="Sign out" onPress={handleSignOut} />
      </View>
    </SafeAreaView>
  );
}