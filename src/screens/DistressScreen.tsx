import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {apiRequest} from '../api/client';
import {getAccessToken} from '../storage/tokens';
import OnboardingSteps from '../components/OnboardingSteps';
import {colors, glass, radius, space, type} from '../theme';
import ElevatedDistressScreen from './ElevatedDistressScreen';

type Props = {
  onContinue: () => void;
};

export default function DistressScreen({onContinue}: Props) {
  const [scale, setScale] = useState<Record<string, string>>({});
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showElevated, setShowElevated] = useState(false); // FR-ONB-007

  useEffect(() => {
    apiRequest('/onboarding/distress-scale')
      .then(setScale)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleContinue() {
    if (value === null) {
      setError('Choose the option that fits best.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      const token = await getAccessToken();
      await apiRequest('/onboarding/distress-baseline', {
        method: 'POST',
        body: {value},
        token: token ?? undefined,
      });

      // FR-ONB-007: 9 or 10 routes to the acknowledgement screen instead of
      // straight to the next onboarding step. Continuing from that screen
      // still advances onboarding via the same onContinue passed in here.
      if (value >= 9) {
        setShowElevated(true);
      } else {
        onContinue();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (showElevated) {
    return <ElevatedDistressScreen onContinue={onContinue} />;
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: 40,
          paddingBottom: 32,
        }}>
        <OnboardingSteps step={5} />
        <Text style={type.title}>
          How would you describe your current distress level?
        </Text>
        <Text style={{...type.body, marginTop: 10, marginBottom: 24}}>
          This helps us tailor your experience.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.sage} />
        ) : (
          Object.entries(scale).map(([key, description]) => {
            const number = Number(key);
            const isOn = value === number;

            return (
              <Pressable
                key={key}
                onPress={() => setValue(number)}
                style={{
                  ...glass,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isOn ? colors.surface : colors.glass,
                  borderColor: isOn ? colors.accent : colors.glassEdge,
                  borderRadius: radius.card,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radius.pill,
                    backgroundColor: isOn ? colors.accent : colors.accentWash,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}>
                  <Text
                    style={{
                      ...type.small,
                      color: isOn ? colors.onAccent : colors.inkSoft,
                    }}>
                    {key}
                  </Text>
                </View>

                <Text style={{...type.body, color: colors.ink, flex: 1}}>
                  {description}
                </Text>
              </Pressable>
            );
          })
        )}

        {error ? (
          <Text style={{...type.small, color: colors.alert, marginTop: 12}}>
            {error}
          </Text>
        ) : null}

        <View style={{marginTop: 20}}>
          <PrimaryButton label="Continue" onPress={handleContinue} busy={busy} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}