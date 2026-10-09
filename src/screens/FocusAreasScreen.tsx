import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check, Leaf} from 'lucide-react-native';

import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {apiRequest} from '../api/client';
import {getAccessToken} from '../storage/tokens';
import OnboardingSteps from '../components/OnboardingSteps';
import {colors, glass, radius, space, type} from '../theme';

type Props = {
  onContinue: () => void;
};

export default function FocusAreasScreen({onContinue}: Props) {
  const [options, setOptions] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/onboarding/focus-areas/options')
      .then(setOptions)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  function toggle(code: string) {
    setSelected(current =>
      current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code],
    );
  }

  async function handleContinue() {
    setError('');
    setBusy(true);

    try {
      const token = await getAccessToken();
      await apiRequest('/onboarding/focus-areas', {
        method: 'PUT',
        body: {codes: selected},
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
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.screen,
          paddingTop: 40,
          paddingBottom: 32,
        }}>
        <OnboardingSteps step={2} />
        <Text style={type.title}>What brings you here?</Text>
        <Text style={{...type.body, marginTop: 10, marginBottom: 28}}>
          Select all that apply.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.sage} />
        ) : (
          Object.entries(options).map(([code, label]) => {
            const isOn = selected.includes(code);

            return (
              <Pressable
                key={code}
                onPress={() => toggle(code)}
                style={{
                  ...glass,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isOn ? colors.surface : colors.glass,
                  borderColor: isOn ? colors.accent : colors.glassEdge,
                  borderRadius: radius.card,
                  padding: 16,
                  marginBottom: 10,
                }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.pill,
                    backgroundColor: colors.accentWash,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}>
                  <Leaf size={16} color={colors.accent} />
                </View>

                <Text style={{...type.label, flex: 1}}>{label}</Text>

                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: radius.pill,
                    borderWidth: 1.5,
                    borderColor: isOn ? colors.accent : colors.muted,
                    backgroundColor: isOn ? colors.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {isOn ? <Check size={14} color={colors.onAccent} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })
        )}

        {error ? (
          <Text style={{...type.small, color: colors.alert, marginTop: 12}}>
            {error}
          </Text>
        ) : null}

        <View style={{flex: 1, minHeight: 24}} />

        <PrimaryButton label="Continue" onPress={handleContinue} busy={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}