import React, {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import {apiRequest} from '../api/client';
import {getAccessToken} from '../storage/tokens';
import OnboardingSteps from '../components/OnboardingSteps';
import {colors, radius, space, type} from '../theme';

type Props = {
  onAgreed: () => void;
};

const points = [
  {
    title: 'Your data is private',
    body: 'We do not sell or share your personal information.',
  },
  {
    title: "You're in control",
    body: 'You can export or delete your data at any time.',
  },
  {
    title: 'A safe, supportive space',
    body: 'This app is not a substitute for professional care, but we are here to support you.',
  },
];

export default function ConsentScreen({onAgreed}: Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAgree() {
    setError('');
    setBusy(true);

    try {
      const token = await getAccessToken();
      await apiRequest('/onboarding/consent', {
        method: 'POST',
        body: {version: 'v1'},
        token: token ?? undefined,
      });
      onAgreed();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.screen,
          paddingTop: 40,
          paddingBottom: 32,
        }}>
        <OnboardingSteps step={1} />
        <Text style={type.title}>Your privacy matters</Text>
        <Text style={{...type.body, marginTop: 10, marginBottom: 32}}>
          Before we begin, here is how we protect your information and what to
          expect.
        </Text>

        {points.map(point => (
          <View
            key={point.title}
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderRadius: radius.card,
              padding: 16,
              marginBottom: 12,
            }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.sageWash,
                marginRight: 14,
              }}
            />
            <View style={{flex: 1}}>
              <Text style={{...type.label, marginBottom: 4}}>{point.title}</Text>
              <Text style={type.body}>{point.body}</Text>
            </View>
          </View>
        ))}

        {error ? (
          <Text style={{...type.small, color: colors.alert, marginTop: 12}}>
            {error}
          </Text>
        ) : null}

        <View style={{flex: 1, minHeight: 24}} />

        <PrimaryButton label="I agree" onPress={handleAgree} busy={busy} />

        <Pressable style={{paddingVertical: 16}}>
          <Text style={{...type.small, textAlign: 'center'}}>Learn more</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}