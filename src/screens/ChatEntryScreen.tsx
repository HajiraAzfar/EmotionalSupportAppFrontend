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

import Logo from '../components/Logo';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import LibraryPicker from '../components/chat/LibraryPicker';
import MessageBubble from '../components/chat/MessageBubble';
import MoodScaleControl from '../components/chat/MoodScaleControl';
import SupportCard from '../components/chat/SupportCard';
import TextComposer from '../components/chat/TextComposer';
import TypingIndicator from '../components/chat/TypingIndicator';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {
  CaptureValue,
  acknowledgeNotice,
  chooseConversation,
  createEntry,
  CrisisEvent,
  deleteEntry,
  EntryMessage,
  EntryState,
  getEntry,
  JOURNAL_TITLES,
  newClientId,
  resumeEntry,
  JournalType,
  sendMessage,
  submitCapture,
} from '../api/entries';
import {quickExit} from '../storage/appLock';
import {colors, glass, radius, shadow, space, type} from '../theme';

// What a blank AI Chat opens with. Shown, never stored, so the model never reads it.
const CHAT_GREETING: EntryMessage = {
  id: 'greeting',
  role: 'ai',
  kind: 'chat',
  value_id: null,
  content: "Hi, I'm Echo. What's on your mind? Type, or tap the mic and talk.",
  sequence: 0,
  created_at: '',
};

// Same limit as the server's message (MessageCreate).
const MAX_MESSAGE = 5000;
// Journals: the only words she sees when a step can't be sent. Never a raw error.
const SEND_FAILED = "Couldn't send that. Nothing you wrote is lost.";

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
  // A message on its way to Echo: shown at once, with Echo typing under it,
  // and kept with a retry if it could not be sent.
  const [pending, setPending] = useState<{text: string; failed: boolean} | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  // So the mood from the home card is submitted once, and not again on re-render.
  const moodSent = useRef(false);
  // Journals: what to run again when she taps the retry line (same answer, same client id).
  const retryAction = useRef<(() => Promise<EntryState>) | null>(null);
  // The current list step's selection; its Continue bar sits under the thread.
  const [picked, setPicked] = useState<string[]>([]);
  const pickingFor = entry?.next_capture?.value_id;
  useEffect(() => setPicked([]), [pickingFor]);

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
        if (journalType === 'chat') {
          setError((e as Error).message);
        } else {
          retryAction.current = action;
          setError(SEND_FAILED);
        }
        return null;
      } finally {
        setBusy(false);
      }
    },
    [handleCrisisEvent, journalType],
  );

  // A new AI Chat is only created with her first message, so opening the tab
  // and leaving again leaves nothing behind.
  const blankChat = journalType === 'chat' && !entryId;

  const load = useCallback(() => {
    if (blankChat) {
      return;
    }
    run(() => (entryId ? getEntry(entryId) : createEntry(journalType, parentEntryId)));
  }, [blankChat, entryId, journalType, parentEntryId, run]);

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

  // One conversation message that Echo answers.
  async function say(text: string) {
    setPending({text, failed: false});
    const next = await run(async () => {
      let current = entry;
      if (!current) {
        current = await createEntry('chat');
        setEntry(current);
      }
      return sendMessage(current.id, text);
    });
    setPending(next ? null : {text, failed: true});
  }

  function capture(valueId: string, value: CaptureValue, skipped = false, more = false) {
    if (!entry) {
      return;
    }
    const clientId = newClientId();
    run(() => submitCapture(entry.id, valueId, value, skipped, more, clientId));
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
    if (blankChat && !entry) {
      return (
        <TextComposer
          busy={busy}
          placeholder="Message Echo…"
          maxLength={MAX_MESSAGE}
          onSend={say}
          voice
          voiceSends
        />
      );
    }
    if (!entry) {
      return null;
    }

    if (readOnly) {
      return (
        <Pressable onPress={confirmDelete} style={{paddingVertical: 12}}>
          <Text style={{...type.link, color: colors.alert, textAlign: 'center'}}>
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
            selected={picked}
            onChange={setPicked}
            onCrisisEvent={event => {
              handleCrisisEvent(event);
              // The thread gained a crisis message and the entry's tier may have changed.
              run(() => getEntry(entry.id));
            }}
          />
        );
      }
      return (
        <TextComposer
          key={spec.value_id}
          busy={busy}
          maxLength={spec.max_length ?? undefined}
          // Free write too is one send: sending it finishes the writing and moves
          // on, with no separate "I'm done writing" step.
          placeholder={spec.repeatable ? 'Write everything on your mind, then send.' : undefined}
          onSend={text => capture(spec.value_id, text)}
          allowEmpty={!spec.required}
          voice={spec.voice || entry.journal_type === 'free_write'}
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
            borderColor: colors.accent,
            backgroundColor: pressed ? colors.accentWash : colors.surface,
            ...shadow.sm,
            opacity: busy ? 0.5 : 1,
          })}>
          <Text style={{...type.label, color: colors.accent}}>{label}</Text>
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
      // AI Chat: a plain chat. Voice messages go straight to Echo, and a chat
      // ends by starting a new one, so there is no End session control.
      const chat = entry.journal_type === 'chat';
      return (
        <View>
          <TextComposer
            busy={busy}
            placeholder={chat ? 'Message Echo…' : undefined}
            maxLength={MAX_MESSAGE}
            onSend={say}
            voice
            voiceSends={chat}
          />
          {!chat && (
            <Pressable
              onPress={() => run(() => chooseConversation(entry.id, 'end'))}
              disabled={busy}
              style={{paddingTop: 12}}>
              <Text style={{...type.link, textAlign: 'center'}}>End session</Text>
            </Pressable>
          )}
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
              borderColor: colors.accent,
              backgroundColor: pressed ? colors.accentWash : colors.surface,
              ...shadow.sm,
              opacity: busy ? 0.5 : 1,
            })}>
            <Text style={{...type.label, color: colors.accent}}>Try this again</Text>
          </Pressable>
        )}
        <PrimaryButton
          label={
            entry.journal_type !== 'chat'
              ? 'Return to dashboard'
              : exitLabel
              ? 'Start a new chat'
              : 'Back'
          }
          onPress={onExit}
        />
      </View>
    );
  }

  const highRisk = entry?.crisis_tier === 'danger' || entry?.crisis_tier === 'emergency';

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
        }}>
        {/* FR-JRN-009: leaving is a single action; everything recorded so far is kept. */}
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={{...type.link, color: colors.inkSoft}}>
            {exitLabel ?? (readOnly ? 'Back' : 'Leave')}
          </Text>
        </Pressable>
        <View
          style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}}>
          {journalType === 'chat' ? <Logo size={24} /> : null}
          <Text style={type.heading}>{JOURNAL_TITLES[journalType]}</Text>
        </View>
        {secondaryAction ? (
          <Pressable onPress={secondaryAction.onPress} hitSlop={12} style={{marginRight: 14}}>
            <Text style={type.link}>{secondaryAction.label}</Text>
          </Pressable>
        ) : null}
        {/* Quick exit: one tap to a neutral page; the PIN is asked on return. */}
        <Pressable
          onPress={() => {
            onExit();
            quickExit();
          }}
          hitSlop={12}
          accessibilityLabel="Quick exit"
          style={{marginRight: 14}}>
          <Text style={{...type.link, color: colors.inkSoft}}>Exit</Text>
        </Pressable>
        {/* FR-CRIS-009: crisis resources are always one tap away. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
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
          {!entry && !error && !blankChat && <ActivityIndicator color={colors.sage} />}

          {journalType === 'chat' && !readOnly && !entry?.messages.length && !pending && (
            <MessageBubble message={CHAT_GREETING} />
          )}

          {entry?.messages.map(m => (
            <React.Fragment key={m.id}>
              <MessageBubble message={m} />
              {/* The helplines card is the reply's own field, drawn under it — never text. */}
              {m.card ? <SupportCard prominent={m.card === 'prominent'} /> : null}
            </React.Fragment>
          ))}

          {pending && (
            <>
              <MessageBubble
                message={{...CHAT_GREETING, id: 'pending', role: 'user', content: pending.text}}
              />
              {pending.failed ? (
                <Pressable
                  onPress={() => say(pending.text)}
                  disabled={busy}
                  style={{alignSelf: 'flex-end', marginTop: -4, marginBottom: 12}}>
                  <Text style={{...type.small, color: colors.alert}}>Not sent. Tap to try again</Text>
                </Pressable>
              ) : (
                <TypingIndicator />
              )}
            </>
          )}

          {/* Journals only: AI Chat shows its helplines inline, as support cards above. */}
          {highRisk && !readOnly && journalType !== 'chat' && (
            <View
              style={{
                ...glass,
                borderColor: colors.alert,
                borderRadius: radius.card,
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
                backgroundColor: colors.accentWash,
                borderRadius: radius.card,
                padding: 12,
                marginBottom: 12,
              }}>
              <Text style={type.small}>{entry.support_note}</Text>
            </Pressable>
          )}

          {showReferral && !highRisk && !entry?.support_note && journalType !== 'chat' && (
            <Pressable
              onPress={() => setResourcesOpen(true)}
              style={{
                backgroundColor: colors.accentWash,
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
              {!entry ? (
                <Pressable onPress={load} style={{paddingTop: 8}}>
                  <Text style={type.link}>Try again</Text>
                </Pressable>
              ) : journalType !== 'chat' && retryAction.current ? (
                <Pressable onPress={() => retryAction.current && run(retryAction.current)} style={{paddingTop: 8}}>
                  <Text style={type.link}>Try again</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={{marginTop: 6}}>{renderControl()}</View>
        </ScrollView>

        {/* A list step's Continue stays on screen however long the list. Always
            enabled: continuing with nothing chosen leaves the step empty. */}
        {!readOnly && entry?.next_capture?.control === 'multi_select' && !entry.pending_notice && !entry.pending_resume && (
          <View style={{paddingHorizontal: space.screen, paddingVertical: 10}}>
            <PrimaryButton
              label={picked.length ? `Continue (${picked.length} selected)` : 'Continue'}
              busy={busy}
              onPress={() => capture(entry.next_capture!.value_id, picked)}
            />
          </View>
        )}
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
