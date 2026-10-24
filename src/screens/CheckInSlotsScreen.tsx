import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check, ChevronRight, CloudSun, FileText, Moon, Sun} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {CheckInSlot, SLOT_TITLES, SlotBoard, SlotRow, getCheckInSlots} from '../api/entries';
import {markSlotDone} from '../storage/reminders';
import {colors, font, radius, shadow, space, type} from '../theme';

type Props = {
  onBack: () => void;
  // Start (or carry on) the slot open now, on the day it belongs to.
  onStart: (slot: CheckInSlot, localDate: string) => void;
  // Read a finished check-in.
  onOpenEntry: (entryId: string) => void;
  // The day, week and month reports.
  onOpenReports: () => void;
};

const NAMES: Record<CheckInSlot, string> = {morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening'};
const ICONS = {morning: Sun, afternoon: CloudSun, evening: Moon};

// "18:00" in the phone's own style ("6:00 PM").
function clock(local: string) {
  return new Date(local).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
}

// What each state says. Never a reproach: a slot whose time has passed without
// a check-in is not mentioned at all.
function describe(row: SlotRow): {text: string; action?: string} {
  switch (row.state) {
    case 'done':
      return {text: 'Done'};
    case 'started':
      return {text: 'Started', action: 'Continue'};
    case 'open':
      return {text: `Open until ${clock(row.closes_at)}`, action: 'Start'};
    case 'upcoming':
      return {text: `From ${clock(row.opens_at)}`};
    default:
      return {text: ''};
  }
}

/**
 * Three short check-ins a day, each only while it is open. The one open now
 * leads; today's others and yesterday's finished ones are listed to read.
 */
export default function CheckInSlotsScreen({onBack, onStart, onOpenEntry, onOpenReports}: Props) {
  const [board, setBoard] = useState<SlotBoard | null>(null);
  const [error, setError] = useState('');
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(() => {
    setError('');
    getCheckInSlots()
      .then(next => {
        setBoard(next);
        // A check-in finished elsewhere (another phone, an older build) quiets
        // its reminder here too.
        next.slots.filter(row => row.state === 'done').forEach(row => markSlotDone(row.slot, row.local_date));
      })
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = board?.slots.find(
    row => row.slot === board.current.slot && row.local_date === board.current.local_date,
  );
  const next = board?.slots.find(row => row.state === 'upcoming');
  const shown = board?.slots.filter(row => row.state !== 'closed') ?? [];
  // The board runs oldest first, so its last day is the calendar's today.
  const today = board?.slots[board.slots.length - 1]?.local_date;
  // Today first; yesterday only when something of it is left to read.
  const days = [...new Set(shown.map(row => row.local_date))].reverse();

  function act(row: SlotRow) {
    if (row.state === 'done' && row.entry_id) {
      onOpenEntry(row.entry_id);
    } else if (row.state === 'open' || row.state === 'started') {
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
          Three short check-ins a day, a minute or two each. Each one can be done while it is open;
          do the ones that suit you.
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

            <Pressable
              onPress={onOpenReports}
              accessibilityRole="button"
              accessibilityLabel="Reports"
              style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginTop: 12,
                minHeight: 56,
                paddingHorizontal: 14,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
              })}>
              <FileText size={18} color={colors.accent} />
              <View style={{flex: 1}}>
                <Text style={type.label}>Reports</Text>
                <Text style={type.small}>Your day, week and month, as a PDF</Text>
              </View>
              <ChevronRight size={18} color={colors.inkFaint} />
            </Pressable>

            {days.map(day => (
              <View key={day} style={{marginTop: 24}}>
                <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
                  {day === today ? 'Today' : 'Yesterday'}
                </Text>
                {shown
                  .filter(row => row.local_date === day)
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
