import React, {useEffect, useState} from 'react';
import {Pressable, Switch, Text, View} from 'react-native';

import Chip from '../../components/chat/Chip';
import {colors, radius, type} from '../../theme';
import {
  SAVORING_TIMES,
  clearReminder,
  formatTime,
  getSavoringReminder,
  remindersAvailable,
  setReminder,
} from '../../storage/reminders';
import {SETTINGS} from '../content';
import {DefaultMode, getDefaultMode, setDefaultMode} from '../storage';
import Screen, {Card} from '../../components/ModuleScreen';

/** The journal's own settings: one opt-in reminder (off by default) and how a moment starts. */
export default function SettingsScreen({onBack}: {onBack: () => void}) {
  const [reminder, setReminderTime] = useState<number | null>(null);
  const [mode, setMode] = useState<DefaultMode>('auto');
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    getSavoringReminder().then(setReminderTime).catch(() => undefined);
    getDefaultMode().then(setMode).catch(() => undefined);
  }, []);

  async function choose(minutes: number | null) {
    setDenied(false);
    if (minutes === null) {
      await clearReminder('savoring');
      setReminderTime(null);
      return;
    }
    if ((await setReminder('savoring', minutes)) === 'set') {
      setReminderTime(minutes);
    } else {
      setDenied(true);
    }
  }

  return (
    <Screen title={SETTINGS.title} onBack={onBack}>
      {remindersAvailable ? (
        <Card>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <View style={{flex: 1}}>
              <Text style={type.label}>{SETTINGS.reminder}</Text>
              <Text style={{...type.small, marginTop: 2}}>
                {reminder === null ? SETTINGS.reminderOff : SETTINGS.reminderAt(formatTime(reminder))}
              </Text>
            </View>
            <Switch
              value={reminder !== null}
              onValueChange={on => choose(on ? SAVORING_TIMES[0] : null)}
              accessibilityLabel={SETTINGS.reminder}
              trackColor={{true: colors.accentSoft, false: colors.muted}}
              thumbColor={reminder !== null ? colors.accent : colors.surface}
            />
          </View>
          <Text style={{...type.tiny, marginTop: 8}}>{SETTINGS.reminderHint}</Text>
          {reminder !== null ? (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10}}>
              {SAVORING_TIMES.map(t => (
                <Chip key={t} label={formatTime(t)} on={reminder === t} onPress={() => choose(t)} />
              ))}
            </View>
          ) : null}
          {denied ? (
            <Text style={{...type.small, color: colors.alert, marginTop: 8}}>
              Notifications are off for Mind Doc in your phone's settings.
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Text style={{...type.label, marginBottom: 8}}>{SETTINGS.mode}</Text>
        {SETTINGS.modes.map(m => (
          <Pressable
            key={m.id}
            onPress={() => {
              setMode(m.id);
              setDefaultMode(m.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{checked: mode === m.id}}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginTop: 6,
              borderRadius: radius.tile,
              borderWidth: 1.5,
              borderColor: mode === m.id ? colors.accent : colors.line,
              backgroundColor: mode === m.id ? colors.sageWash : colors.surface,
            }}>
            <Text style={type.label}>{m.label}</Text>
            <Text style={type.small}>{m.hint}</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
