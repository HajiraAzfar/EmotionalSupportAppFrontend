import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Linking, Pressable, ScrollView, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BackButton from '../components/BackButton';
import ScreenBackground from '../components/ScreenBackground';
import {clearReminder, formatTime, getReminder, setReminder} from '../storage/reminders';
import {colors, font, radius, shadow, space, type} from '../theme';

type Props = {
  onBack: () => void;
};

// A few times that cover a day; the reminder is a nudge, not an appointment.
const TIMES = [
  {label: 'Morning', minutes: 9 * 60},
  {label: 'Midday', minutes: 13 * 60},
  {label: 'Evening', minutes: 19 * 60},
  {label: 'Night', minutes: 21 * 60 + 30},
];
const DEFAULT_TIME = 19 * 60;

/**
 * One gentle reminder a day, at a time the user picks, or none. It never says
 * anything about what was written, and missing a day costs nothing.
 */
export default function RemindersScreen({onBack}: Props) {
  const [minutes, setMinutes] = useState<number | null | undefined>(undefined);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getReminder()
      .then(setMinutes)
      .catch(() => setMinutes(null));
  }, []);

  async function choose(value: number | null) {
    setError('');
    setDenied(false);
    try {
      if (value === null) {
        await clearReminder();
        setMinutes(null);
        return;
      }
      const result = await setReminder(value);
      if (result === 'denied') {
        setDenied(true);
        return;
      }
      setMinutes(value);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const on = minutes !== null && minutes !== undefined;

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View style={{paddingHorizontal: space.screen, paddingVertical: 12}}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}>
        <Text accessibilityRole="header" style={type.title}>
          Daily reminder
        </Text>
        <Text style={{...type.body, marginTop: 10}}>
          A gentle nudge once a day to take a moment for yourself. It never shows anything you
          wrote, and missing a day is fine.
        </Text>

        {minutes === undefined ? (
          <ActivityIndicator color={colors.accent} style={{marginTop: 30}} />
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 24,
                padding: 16,
                borderRadius: radius.card,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                ...shadow.sm,
              }}>
              <View style={{flex: 1}}>
                <Text style={type.label}>Remind me</Text>
                <Text style={{...type.small, marginTop: 2}}>
                  {on ? `Every day at ${formatTime(minutes)}` : 'Off'}
                </Text>
              </View>
              <Switch
                value={on}
                onValueChange={next => choose(next ? DEFAULT_TIME : null)}
                accessibilityLabel="Daily reminder"
                trackColor={{false: colors.muted, true: colors.accentSoft}}
                thumbColor={on ? colors.accent : colors.surface}
              />
            </View>

            {on ? (
              <>
                <Text style={{...type.small, marginTop: 22, marginBottom: 10}}>At about</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                  {TIMES.map(time => {
                    const picked = time.minutes === minutes;
                    return (
                      <Pressable
                        key={time.label}
                        onPress={() => choose(time.minutes)}
                        accessibilityRole="radio"
                        accessibilityState={{checked: picked}}
                        accessibilityLabel={`${time.label}, ${formatTime(time.minutes)}`}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: radius.pill,
                          // Same properties in both states (see Chip.tsx).
                          borderWidth: 1.5,
                          borderColor: picked ? colors.accent : colors.muted,
                          backgroundColor: picked ? colors.sageWash : colors.surface,
                        }}>
                        <Text
                          style={{
                            ...type.small,
                            fontFamily: font.semibold,
                            color: picked ? colors.accent : colors.inkSoft,
                          }}>
                          {time.label} · {formatTime(time.minutes)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={{...type.tiny, marginTop: 12}}>
                  Phones save battery by grouping alarms, so it can arrive a few minutes late.
                </Text>
              </>
            ) : null}

            {denied ? (
              <View style={{marginTop: 18}}>
                <Text style={{...type.small, color: colors.alert}}>
                  Notifications are turned off for Mind Doc, so the reminder could not be set.
                </Text>
                <Pressable onPress={() => Linking.openSettings()} hitSlop={8} accessibilityRole="button">
                  <Text style={{...type.link, marginTop: 6}}>Open phone settings</Text>
                </Pressable>
              </View>
            ) : null}

            {error ? (
              <Text style={{...type.small, color: colors.alert, marginTop: 16}}>{error}</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
