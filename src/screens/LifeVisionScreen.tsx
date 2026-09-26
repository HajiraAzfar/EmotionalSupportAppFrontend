import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import {apiRequest} from '../api/client';
import {getAccessToken} from '../storage/tokens';
import {colors, radius, space, type} from '../theme';

const MAX_LENGTH = 160;

type Props = {
  onContinue: () => void;
};

export default function LifeVisionScreen({onContinue}: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    if (!text.trim()) {
      onContinue();
      return;
    }

    setError('');
    setBusy(true);

    try {
      const token = await getAccessToken();
      await apiRequest('/onboarding/life-vision', {
        method: 'POST',
        body: {text: text.trim()},
        token: token ?? undefined,
      });
      onContinue();
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
          <Text style={type.title}>
            How do you imagine your life would be different?
          </Text>
          <Text style={{...type.body, marginTop: 10, marginBottom: 28}}>
            There is no right answer. Write whatever comes to mind.
          </Text>

          <Text style={{...type.small, marginBottom: 7}}>
            Describe how life would be different
          </Text>

          <TextInput
            value={text}
            onChangeText={t => t.length <= MAX_LENGTH && setText(t)}
            placeholder="I would feel..."
            placeholderTextColor={colors.inkFaint}
            multiline
            textAlignVertical="top"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.card,
              paddingHorizontal: 16,
              paddingVertical: 15,
              fontSize: 15,
              color: colors.ink,
              minHeight: 120,
            }}
          />

          <Text style={{...type.small, textAlign: 'right', marginTop: 8}}>
            {text.length} / {MAX_LENGTH}
          </Text>

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginTop: 12}}>
              {error}
            </Text>
          ) : null}

          <View style={{flex: 1, minHeight: 24}} />

          <PrimaryButton label="Continue" onPress={handleContinue} busy={busy} />

          <Pressable onPress={onContinue} style={{paddingVertical: 16}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              Skip for now
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}