import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Linking, Pressable, ScrollView, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BackButton from '../components/BackButton';
import ScreenBackground from '../components/ScreenBackground';
import {CheckInSlot, SLOT_TITLES} from '../api/entries';
import {
  Reminders,
  SLOTS,
  SLOT_TIMES,
  clearReminder,
  formatTime,
  getReminders,
  setReminder,
} from '../storage/reminders';
import {colors, font, radius, shadow, space, type} from '../theme';

type Props = {
  onBack: () => void;
};

/**
 * A reminder when each check-in opens, each on or off and at a time the user
 * picks. It never says anything about what was written, and missing one
 * costs nothing.
 */
export default function RemindersScreen({onBack}: Props) {
  const [reminders, setReminders] = useState<Reminders | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getReminders()
      .then(setReminders)
      .catch(() => setReminders({morning: null, afternoon: null, evening: null}));
  }, []);

  async function choose(slot: CheckInSlot, value: number | null) {
    setError('');
    setDenied(false);
    try {
      if (value === null) {
        await clearReminder(slot);
      } else if ((await setReminder(slot, value)) === 'denied') {
        setDenied(true);
        return;
      }
      setReminders(current => (current ? {...current, [slot]: value} : current));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View style={{paddingHorizontal: space.screen, paddingVertical: 12}}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}>
        <Text accessibilityRole="header" style={type.title}>
          Check-in reminders
        </Text>
        <Text style={{...type.body, marginTop: 10}}>
          A gentle nudge when a check-in opens. They never show anything you wrote, and missing one
          is fine.
        </Text>

        {reminders === null ? (
          <ActivityIndicator color={colors.accent} style={{marginTop: 30}} />
        ) : (
          SLOTS.map(slot => {
            const minutes = reminders[slot];
            const on = minutes !== null;
            return (
              <View
                key={slot}
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: radius.card,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.line,
                  ...shadow.sm,
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View style={{flex: 1}}>
                    <Text style={type.label}>{SLOT_TITLES[slot]}</Text>
                    <Text style={{...type.small, marginTop: 2}}>
                      {on ? `Every day at ${formatTime(minutes)}` : 'Off'}
                    </Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={next => choose(slot, next ? SLOT_TIMES[slot][0] : null)}
                    accessibilityLabel={`${SLOT_TITLES[slot]} reminder`}
                    trackColor={{false: colors.muted, true: colors.accentSoft}}
                    thumbColor={on ? colors.accent : colors.surface}
                  />
                </View>
                {on ? (
                  <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12}}>
                    {[...SLOT_TIMES[slot]].sort((a, b) => a - b).map(time => {
                      const picked = time === minutes;
                      return (
                        <Pressable
                          key={time}
                          onPress={() => choose(slot, time)}
                          accessibilityRole="radio"
                          accessibilityState={{checked: picked}}
                          accessibilityLabel={`${SLOT_TITLES[slot]} at ${formatTime(time)}`}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
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
                            {formatTime(time)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <Text style={{...type.tiny, marginTop: 14}}>
          Phones save battery by grouping alarms, so a reminder can arrive a few minutes late.
        </Text>

        {denied ? (
          <View style={{marginTop: 18}}>
            <Text style={{...type.small, color: colors.alert}}>
              Notifications are turned off for Reframe, so the reminder could not be set.
            </Text>
            <Pressable onPress={() => Linking.openSettings()} hitSlop={8} accessibilityRole="button">
              <Text style={{...type.link, marginTop: 6}}>Open phone settings</Text>
            </Pressable>
          </View>
        ) : null}

        {error ? <Text style={{...type.small, color: colors.alert, marginTop: 16}}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
