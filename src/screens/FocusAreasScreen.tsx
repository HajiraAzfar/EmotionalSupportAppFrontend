import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import {apiRequest} from '../api/client';
import {getAccessToken} from '../storage/tokens';
import {colors, radius, space, type} from '../theme';

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
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.screen,
          paddingTop: 40,
          paddingBottom: 32,
        }}>
        <Text style={type.title}>What would you like to focus on?</Text>
        <Text style={{...type.body, marginTop: 10, marginBottom: 28}}>
          Choose what feels most relevant right now. You can always change this
          later.
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
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: isOn ? colors.sage : colors.line,
                  borderRadius: radius.card,
                  padding: 16,
                  marginBottom: 10,
                }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: colors.sageWash,
                    marginRight: 14,
                  }}
                />

                <Text style={{...type.label, flex: 1}}>{label}</Text>

                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: isOn ? colors.forest : colors.line,
                    backgroundColor: isOn ? colors.forest : 'transparent',
                  }}
                />
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