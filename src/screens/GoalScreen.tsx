import React, {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import {apiRequest} from '../api/client';
import {getAccessToken} from '../storage/tokens';
import {colors, radius, space, type} from '../theme';

type Props = {
  onContinue: () => void;
};

const goals = [
  {days: 2, label: '2 days a week', note: 'A gentle start'},
  {days: 3, label: '3 days a week', note: 'A solid rhythm'},
  {days: 5, label: '5 days a week', note: 'A good balance'},
  {days: 7, label: '7 days a week', note: 'For consistent support'},
];

export default function GoalScreen({onContinue}: Props) {
  const [selected, setSelected] = useState(3);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    setError('');
    setBusy(true);

    try {
      const token = await getAccessToken();
      await apiRequest('/onboarding/goal', {
        method: 'PUT',
        body: {weekly_goal: selected},
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
        <Text style={type.title}>How often would you like to write?</Text>
        <Text style={{...type.body, marginTop: 10, marginBottom: 28}}>
          This is just a guide. You can change it anytime.
        </Text>

        {goals.map(goal => {
          const isOn = selected === goal.days;

          return (
            <Pressable
              key={goal.days}
              onPress={() => setSelected(goal.days)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isOn ? colors.sageWash : colors.surface,
                borderWidth: 1,
                borderColor: isOn ? colors.sage : colors.line,
                borderRadius: radius.card,
                padding: 16,
                marginBottom: 10,
              }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: isOn ? colors.forest : colors.sageWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: isOn ? colors.surface : colors.inkSoft,
                  }}>
                  {goal.days}
                </Text>
              </View>

              <View>
                <Text style={type.label}>{goal.label}</Text>
                <Text style={{...type.small, marginTop: 2}}>{goal.note}</Text>
              </View>
            </Pressable>
          );
        })}

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