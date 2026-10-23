import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check, ChevronRight, CloudSun, Moon, Sun} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {CheckInSlot, SLOT_TITLES, SlotBoard, SlotRow, getCheckInSlots} from '../api/entries';
import {colors, font, radius, shadow, space, type} from '../theme';

type Props = {
  onBack: () => void;
  // Start (or carry on) a slot's check-in; localDate when adding a past one.
  onStart: (slot: CheckInSlot, localDate: string) => void;
  // Read a finished check-in.
  onOpenEntry: (entryId: string) => void;
};

const NAMES: Record<CheckInSlot, string> = {morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening'};
const ICONS = {morning: Sun, afternoon: CloudSun, evening: Moon};

// "18:00" in the phone's own style ("6:00 PM").
function clock(local: string) {
  return new Date(local).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
}

// What each state says. Never a reproach: a slot not filled in is simply open
// to add, and one that has closed is not mentioned at all.
function describe(row: SlotRow): {text: string; action?: string} {
  switch (row.state) {
    case 'done':
      return {text: 'Done'};
    case 'started':
      return {text: 'Started', action: 'Continue'};
    case 'open':
      return {text: `Open until ${clock(row.closes_at)}`, action: 'Start'};
    case 'missed':
      return {text: 'Not filled in', action: 'Add it'};
    case 'upcoming':
      return {text: `From ${clock(row.opens_at)}`};
    default:
      return {text: ''};
  }
}

/**
 * Three short check-ins a day. The one open now leads; the rest of today and
 * yesterday are listed so a missed one can still be added (up to a day late).
 */
export default function CheckInSlotsScreen({onBack, onStart, onOpenEntry}: Props) {
  const [board, setBoard] = useState<SlotBoard | null>(null);
  const [error, setError] = useState('');
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(() => {
    setError('');
    getCheckInSlots()
      .then(setBoard)
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = board?.slots.find(
    row => row.slot === board.current.slot && row.local_date === board.current.local_date,
  );
  const next = board?.slots.find(row => row.state === 'upcoming');
  const days = board ? [...new Set(board.slots.map(row => row.local_date))].reverse() : [];

  function act(row: SlotRow) {
    if (row.state === 'done' && row.entry_id) {
      onOpenEntry(row.entry_id);
    } else if (['open', 'started', 'missed'].includes(row.state)) {
      onStart(row.slot, row.local_date);
    }
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View
        style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen, paddingVertical: 12}}>
        <BackButton onPress={onBack} />
        <View style={{flex: 1}} />
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}>
        <Text accessibilityRole="header" style={type.title}>
          Check-ins
        </Text>
        <Text style={{...type.body, marginTop: 6}}>
          Three short check-ins a day, a minute or two each. Do the ones that suit you; one you miss
          can still be added until the end of the next day.
        </Text>

        {error ? (
          <Pressable onPress={load} style={{marginTop: 20}}>
            <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
          </Pressable>
        ) : !board || !current ? (
          <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
        ) : (
          <>
            {/* The check-in open now. */}
            <View
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: radius.card,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                ...shadow.md,
              }}>
              <Text style={type.heading}>{SLOT_TITLES[current.slot]}</Text>
              {current.state === 'done' ? (
                <Text style={{...type.body, marginTop: 6}}>
                  Done for this {current.slot}.
                  {next ? ` The next one opens at ${clock(next.opens_at)}.` : ''}
                </Text>
              ) : (
                <>
                  <Text style={{...type.small, marginTop: 4}}>Open until {clock(current.closes_at)}</Text>
                  <View style={{marginTop: 14}}>
                    <PrimaryButton
                      label={current.state === 'started' ? 'Continue' : 'Start'}
                      onPress={() => onStart(current.slot, current.local_date)}
                    />
                  </View>
                </>
              )}
            </View>

            {days.map((day, index) => (
              <View key={day} style={{marginTop: 24}}>
                <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
                  {index === 0 ? 'Today' : 'Yesterday'}
                </Text>
                {board.slots
                  .filter(row => row.local_date === day && row.state !== 'closed')
                  .map(row => {
                    const {text, action} = describe(row);
                    const Icon = ICONS[row.slot];
                    const tappable = row.state === 'done' || Boolean(action);
                    return (
                      <Pressable
                        key={`${row.local_date}-${row.slot}`}
                        onPress={() => act(row)}
                        disabled={!tappable}
                        accessibilityRole="button"
                        accessibilityLabel={`${NAMES[row.slot]}: ${text}`}
                        style={({pressed}) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          minHeight: 56,
                          paddingHorizontal: 14,
                          marginBottom: 8,
                          borderRadius: radius.card,
                          borderWidth: 1,
                          borderColor: colors.line,
                          backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
                        })}>
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: radius.pill,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.sageWash,
                          }}>
                          {row.state === 'done' ? (
                            <Check size={17} color={colors.accent} />
                          ) : (
                            <Icon size={17} color={colors.accent} />
                          )}
                        </View>
                        <View style={{flex: 1}}>
                          <Text style={type.label}>{NAMES[row.slot]}</Text>
                          <Text style={type.small}>{text}</Text>
                        </View>
                        {action ? (
                          <Text style={{...type.small, fontFamily: font.semibold, color: colors.accent}}>
                            {action}
                          </Text>
                        ) : row.state === 'done' ? (
                          <ChevronRight size={18} color={colors.inkFaint} />
                        ) : null}
                      </Pressable>
                    );
                  })}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}
