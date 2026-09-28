import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import LibraryPicker from '../components/chat/LibraryPicker';
import MessageBubble from '../components/chat/MessageBubble';
import MoodScaleControl from '../components/chat/MoodScaleControl';
import TextComposer from '../components/chat/TextComposer';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {
  CaptureValue,
  acknowledgeNotice,
  chooseConversation,
  createEntry,
  CrisisEvent,
  deleteEntry,
  EntryState,
  getEntry,
  JOURNAL_TITLES,
  resumeEntry,
  JournalType,
  sendMessage,
  submitCapture,
} from '../api/entries';
import {colors, radius, space, type} from '../theme';

type Props = {
  journalType: JournalType;
  // Set to resume a draft, or (with readOnly) to open a past entry.
  entryId?: string;
  // FR-JRN-006: start a further exposure cycle from this completed one.
  parentEntryId?: string;
  // FR-ENT-028: a retrieved entry is shown without any input or continue control.
  readOnly?: boolean;
  onExit: () => void;
  // A mood tapped on the home card: recorded as soon as the entry opens, so
  // she does not answer the same question twice.
  startMood?: number;
  // The AI Chat tab calls leaving "New chat", and offers its own second action.
  exitLabel?: string;
  secondaryAction?: {label: string; onPress: () => void};
};

// FR-ENT-002: the whole entry is one scrolling thread; every control sits
// inline beneath the message that asks for it. No step counter, no progress bar.
export default function ChatEntryScreen({
  journalType,
  entryId,
  parentEntryId,
  readOnly = false,
  startMood,
  onExit,
  exitLabel,
  secondaryAction,
}: Props) {
  const [entry, setEntry] = useState<EntryState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  // Resources open as a modal so the thread (and its state) stays underneath.
  const [resourcesOpen, setResourcesOpen] = useState(false);
  // FR-CRIS-007: emergency content stays until explicitly acknowledged.
  const [emergencyText, setEmergencyText] = useState<string | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  // So the mood from the home card is submitted once, and not again on re-render.
  const moodSent = useRef(false);

  const handleCrisisEvent = useCallback((event: CrisisEvent | null) => {
    if (event?.tier === 'emergency') {
      setEmergencyText(event.text);
    }
    // danger: fixed content is already in the thread, plus the card below.
    // mild: no interruption (FR-CRIS-005); the support note appears at the end.
  }, []);

  const run = useCallback(
    async (action: () => Promise<EntryState>) => {
      setBusy(true);
      setError('');
      try {
        const next = await action();
        setEntry(next);
        handleCrisisEvent(next.crisis_event);
        if (next.referral) {
          setShowReferral(true);
        }
        return next;
      } catch (e) {
        setError((e as Error).message);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [handleCrisisEvent],
  );

  const load = useCallback(() => {
    run(() => (entryId ? getEntry(entryId) : createEntry(journalType, parentEntryId)));
  }, [entryId, journalType, parentEntryId, run]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (
      startMood === undefined ||
      moodSent.current ||
      busy ||
      entry?.next_capture?.value_id !== 'mood'
    ) {
      return;
    }
    moodSent.current = true;
    run(() => submitCapture(entry.id, 'mood', startMood, false, false));
  }, [entry, startMood, busy, run]);

  function capture(valueId: string, value: CaptureValue, skipped = false, more = false) {
    if (!entry) {
      return;
    }
    run(() => submitCapture(entry.id, valueId, value, skipped, more));
  }

  async function stopHere() {
    if (!entry) {
      return;
    }
    const next = await run(() => chooseConversation(entry.id, 'stop'));
    if (next) {
      onExit();
    }
  }

  function confirmDelete() {
    if (!entry) {
      return;
    }
    Alert.alert(
      'Delete this entry?',
      'It will be permanently removed, including everything you recorded in it.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.id);
              onExit();
            } catch (e) {
              setError((e as Error).message);
            }
          },
        },
      ],
    );
  }

  function renderControl() {
    if (!entry) {
      return null;
    }

    if (readOnly) {
      return (
        <Pressable onPress={confirmDelete} style={{paddingVertical: 12}}>
          <Text style={{...type.small, color: colors.alert, textAlign: 'center'}}>
            Delete entry
          </Text>
        </Pressable>
      );
    }

    // FR-JRN-007: nothing else is offered until she has read the scope notice.
    if (entry.pending_notice) {
      return (
        <PrimaryButton
          label="I understand"
          busy={busy}
          onPress={() => run(() => acknowledgeNotice(entry.id))}
        />
      );
    }

    // FR-JRN-006: the plan is made; the rest waits until she has done it.
    if (entry.pending_resume) {
      return (
        <PrimaryButton
          label="I've done it — continue"
          busy={busy}
          onPress={() => run(() => resumeEntry(entry.id))}
        />
      );
    }

    const spec = entry.next_capture;
    if (spec) {
      if (spec.control === 'scale' && spec.scale) {
        return (
          <MoodScaleControl
            options={spec.scale}
            busy={busy}
            onSelect={v => capture(spec.value_id, v)}
          />
        );
      }
      if (spec.control === 'multi_select' && spec.library) {
        return (
          <LibraryPicker
            key={spec.value_id}
            library={spec.library}
            preferValence={spec.prefer_valence}
            entryId={entry.id}
            busy={busy}
            onSubmit={ids => capture(spec.value_id, ids)}
            onCrisisEvent={event => {
              handleCrisisEvent(event);
              // The thread gained a crisis message and the entry's tier may have changed.
              run(() => getEntry(entry.id));
            }}
          />
        );
      }
      const written = entry.messages.some(
        m => m.kind === 'capture_answer' && m.value_id === spec.value_id,
      );
      return (
        <TextComposer
          key={spec.value_id}
          busy={busy}
          maxLength={spec.max_length ?? undefined}
          // FR-JRN-003: a repeatable value is sent message by message until she is done.
          onSend={text => capture(spec.value_id, text, false, spec.repeatable)}
          onSkip={spec.required ? undefined : () => capture(spec.value_id, null, true)}
          onDone={spec.repeatable && written ? () => capture(spec.value_id, '') : undefined}
        />
      );
    }

    if (entry.conversation_status === 'offered') {
      // FR-AIR-001: continuing and stopping at equal prominence.
      const choice = (label: string, onPress: () => void) => (
        <Pressable
          onPress={onPress}
          disabled={busy}
          style={({pressed}) => ({
            flex: 1,
            alignItems: 'center',
            paddingVertical: 15,
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: colors.forest,
            backgroundColor: pressed ? colors.sageWash : colors.surface,
            opacity: busy ? 0.5 : 1,
          })}>
          <Text style={{...type.label, color: colors.forest}}>{label}</Text>
        </Pressable>
      );
      return (
        <View style={{flexDirection: 'row', gap: 10}}>
          {choice('Talk it through', () =>
            run(() => chooseConversation(entry.id, 'continue')),
          )}
          {choice('Stop here', stopHere)}
        </View>
      );
    }

    if (entry.conversation_status === 'active') {
      return (
        <View>
          <TextComposer
            busy={busy}
            onSend={text => run(() => sendMessage(entry.id, text))}
            // The extended free-write session: she can finish her thought across
            // several messages, and Echo answers all of it at once.
            onSendMore={
              entry.journal_type === 'free_write'
                ? text => run(() => sendMessage(entry.id, text, true))
                : undefined
            }
          />
          <Pressable
            onPress={() => run(() => chooseConversation(entry.id, 'end'))}
            disabled={busy}
            style={{paddingTop: 12}}>
            <Text style={{...type.small, textAlign: 'center'}}>End session</Text>
          </Pressable>
        </View>
      );
    }

    // FR-AIR-005: once the session is over, the input is gone — only the way out remains.
    // FR-JRN-006: a completed exposure can start a further cycle with the same fear.
    return (
      <View>
        {entry.journal_type === 'exposure' && entry.status === 'completed' && (
          <Pressable
            onPress={() => run(() => createEntry('exposure', entry.id))}
            disabled={busy}
            style={({pressed}) => ({
              alignItems: 'center',
              paddingVertical: 15,
              marginBottom: 10,
              borderRadius: radius.pill,
              borderWidth: 1.5,
              borderColor: colors.forest,
              backgroundColor: pressed ? colors.sageWash : colors.surface,
              opacity: busy ? 0.5 : 1,
            })}>
            <Text style={{...type.label, color: colors.forest}}>Try this again</Text>
          </Pressable>
        )}
        <PrimaryButton label="Return to dashboard" onPress={onExit} />
      </View>
    );
  }

  const highRisk = entry?.crisis_tier === 'danger' || entry?.crisis_tier === 'emergency';

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}>
        {/* FR-JRN-009: leaving is a single action; everything recorded so far is kept. */}
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={{...type.small, color: colors.inkSoft}}>
            {exitLabel ?? (readOnly ? 'Back' : 'Leave')}
          </Text>
        </Pressable>
        <Text style={{...type.label, flex: 1, textAlign: 'center', fontFamily: 'serif'}}>
          {JOURNAL_TITLES[journalType]}
        </Text>
        {secondaryAction ? (
          <Pressable onPress={secondaryAction.onPress} hitSlop={12} style={{marginRight: 14}}>
            <Text style={{...type.small, color: colors.accent}}>{secondaryAction.label}</Text>
          </Pressable>
        ) : null}
        {/* FR-CRIS-009: crisis resources are always one tap away. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.small, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() => !readOnly && scrollRef.current?.scrollToEnd({animated: true})}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: space.screen,
            paddingTop: 20,
            paddingBottom: 32,
          }}>
          {!entry && !error && <ActivityIndicator color={colors.sage} />}

          {entry?.messages.map(m => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {highRisk && !readOnly && (
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.alert,
                borderRadius: radius.card,
                backgroundColor: colors.surface,
                padding: 14,
                marginBottom: 12,
              }}>
              <Text style={{...type.body, color: colors.ink, marginBottom: 10}}>
                People are available to talk to right now, for free.
              </Text>
              <PrimaryButton label="See who you can call" onPress={() => setResourcesOpen(true)} />
            </View>
          )}

          {/* FR-CRIS-005: mild tier — a quiet reference at the end, never a pop-up. */}
          {entry?.support_note && !highRisk && (
            <Pressable
              onPress={() => setResourcesOpen(true)}
              style={{
                backgroundColor: colors.sageWash,
                borderRadius: radius.card,
                padding: 12,
                marginBottom: 12,
              }}>
              <Text style={type.small}>{entry.support_note}</Text>
            </Pressable>
          )}

          {showReferral && !highRisk && !entry?.support_note && (
            <Pressable
              onPress={() => setResourcesOpen(true)}
              style={{
                backgroundColor: colors.sageWash,
                borderRadius: radius.card,
                padding: 12,
                marginBottom: 12,
              }}>
              <Text style={type.small}>
                Talking with someone trained can help with what you're carrying.
                Tap to see support options.
              </Text>
            </Pressable>
          )}

          {error ? (
            <View style={{marginBottom: 12}}>
              <Text style={{...type.small, color: colors.alert}}>{error}</Text>
              {!entry && (
                <Pressable onPress={load} style={{paddingTop: 8}}>
                  <Text style={{...type.small, color: colors.forest}}>Try again</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          <View style={{marginTop: 6}}>{renderControl()}</View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={resourcesOpen && !emergencyText}
        animationType="slide"
        onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>

      {/* Back button does nothing here: the only ways out are acknowledging or calling. */}
      <Modal visible={emergencyText !== null} animationType="fade" onRequestClose={() => {}}>
        <CrisisResourcesScreen
          intro={emergencyText ?? undefined}
          closeLabel="I've read this"
          onClose={() => setEmergencyText(null)}
        />
      </Modal>
    </SafeAreaView>
  );
}
