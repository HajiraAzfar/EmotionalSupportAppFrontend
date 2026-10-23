import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft, EyeOff, Plus, Sparkles} from 'lucide-react-native';

import {brandImages} from '../assets/brand';
import Flashcard from '../components/Flashcard';
import Illustration from '../components/illustrations/Illustration';
import {IllustrationName} from '../components/illustrations/art';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import LibraryPicker from '../components/chat/LibraryPicker';
import MoodScaleControl from '../components/chat/MoodScaleControl';
import RatingSetControl from '../components/chat/RatingSetControl';
import {MicButton, RecordingBar, useVoiceNote} from '../components/chat/VoiceNote';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {
  CaptureSpec,
  CaptureValue,
  CrisisEvent,
  EntryState,
  JournalType,
  askPerspective,
  createEntry,
  deleteEntry,
  reviseCapture,
  submitCapture,
} from '../api/entries';
import {quickExit} from '../storage/appLock';
import {colors, font, radius, shadow, space, type} from '../theme';

type DeckJournal = 'check_in' | 'savouring' | 'thought';

type Props = {
  // The short journals and the thought record run as a deck: one question on
  // screen, the next decided by the last answer. Exposure keeps the thread,
  // where its pause and resume have somewhere to live.
  journalType: DeckJournal;
  onExit: () => void;
  // Check-in and the thought record offer a reflection when they finish; that
  // happens in the thread, which is the screen built for a conversation.
  onContinueInThread: (entryId: string, journalType: JournalType) => void;
};

// The brand brief's names.
const TITLES: Record<DeckJournal, string> = {
  check_in: 'Check-in',
  savouring: 'Saving Journal',
  thought: 'Thought Journal',
};

// A picture and one quiet line above the first card only, so a journal opens
// gently and then gets out of the way.
const INTROS: Record<DeckJournal, {line: string; image?: ImageSourcePropType; art?: IllustrationName}> = {
  check_in: {line: 'Take a moment. Your feelings matter.', image: brandImages.landscape},
  savouring: {line: 'Notice what made today a little better.', art: 'mindfulness'},
  thought: {line: 'Slow the thought down, one step at a time.', art: 'thoughts'},
};

// Starters for the Saving Journal's first answer, shown while it is empty.
// Tapping one begins the sentence; the rest is the user's own.
const SAVING_STARTERS = ['A small joy', 'A kind moment', 'A good conversation', 'Something I did well'];

// Short labels for the review card and the headings. The questions themselves
// are worded by the model and are whole sentences; these are only row headings.
const LABELS: Record<string, string> = {
  mood: 'Mood',
  feelings: 'Feelings',
  feeling_intensity: 'How strong',
  triggers: 'Around it',
  trigger_note: 'Your note',
  thinking_traps: 'Patterns',
  event: 'The moment',
  significance: 'Why it mattered',
  name: 'Name',
  situation: 'What happened',
  automatic_thought: 'The thought',
  emotions_before: 'How strong',
  supporting_evidence: 'What makes it feel true',
  contradicting_evidence: "What doesn't fit",
  revised_thought: 'How you would put it now',
  emotions_after: 'How they sit now',
};

const SEND_FAILED = "Couldn't send that. Nothing you wrote is lost.";
const NO_PERSPECTIVE = "Couldn't think of another angle just now. What you write is yours anyway.";

// The one value the suggestion belongs to: it is another way of reading the
// thought, offered while she is writing how she would put it now.
const PERSPECTIVE_AT = 'revised_thought';

export default function DeckScreen({journalType, onExit, onContinueInThread}: Props) {
  const [entry, setEntry] = useState<EntryState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);
  const [emergencyText, setEmergencyText] = useState<string | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [seenCrisis, setSeenCrisis] = useState<string[]>([]);
  // A value she has gone back to. While this is set, the card edits that answer
  // instead of asking the next question.
  const [editing, setEditing] = useState<string | null>(null);
  const retry = useRef<(() => Promise<EntryState>) | null>(null);
  // Every spec the server has sent this session, so an answer can be shown
  // again with the control it was given with — the server only ever sends the
  // next one, and going back must not invent a control.
  const seen = useRef<Record<string, CaptureSpec>>({});

  const spec = editing ? seen.current[editing] : entry?.next_capture ?? null;
  const asking = spec?.value_id;

  const run = useCallback(async (action: () => Promise<EntryState>) => {
    setBusy(true);
    setError('');
    try {
      const next = await action();
      setEntry(next);
      if (next.next_capture) {
        seen.current[next.next_capture.value_id] = next.next_capture;
      }
      if (next.crisis_event?.tier === 'emergency') {
        setEmergencyText(next.crisis_event.text);
      }
      return next;
    } catch {
      retry.current = action;
      setError(SEND_FAILED);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    run(() => createEntry(journalType));
  }, [journalType, run]);

  const answered = (entry?.messages ?? []).filter(m => m.kind === 'capture_answer');
  // Her latest version of each answer: a revision is appended rather than
  // replacing what she first wrote, so the review reads the last of each.
  const latest = new Map(answered.map(m => [m.value_id ?? '', m]));
  const closing = entry?.messages.find(m => m.kind === 'closing');
  const perspective = entry?.messages.find(m => m.kind === 'perspective');

  // What she can go back to: answers already given, in the order they were given.
  const trail = [...latest.keys()].filter(valueId => seen.current[valueId]);
  const previousValue = trail[trail.length - 1];

  // Fill the controls from the answer being edited, and clear them between cards.
  useEffect(() => {
    if (!editing) {
      setPicked([]);
      setText('');
      setRatings({});
      setExpanded(false);
      return;
    }
    const editSpec = seen.current[editing];
    const recorded = entry?.messages.filter(m => m.value_id === editing && m.kind === 'capture_answer');
    const last = recorded?.[recorded.length - 1]?.content ?? '';
    if (editSpec?.control === 'free_text') {
      setText(last);
      setExpanded(true);
    }
    // Pills and ratings are not reconstructed from their display text: the ids
    // behind the words are not in it. She re-picks, starting from nothing,
    // rather than from a guess about what the words meant.
    if (editSpec?.control === 'rating_set') {
      setRatings({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  useEffect(() => {
    if (editing) {
      return;
    }
    setPicked([]);
    setText('');
    setRatings(carriedRatings(entry?.next_capture));
    setExpanded(false);
  }, [asking, editing, entry?.next_capture]);

  // Leaving before anything was answered should leave nothing behind.
  async function leave() {
    const untouched = entry && entry.status === 'in_progress' && answered.length === 0;
    if (untouched) {
      deleteEntry(entry.id).catch(() => {});
    }
    onExit();
  }

  function answer(value: CaptureValue, skipped = false) {
    if (!entry || !spec) {
      return;
    }
    const valueId = spec.value_id;
    if (editing) {
      setEditing(null);
      run(() => reviseCapture(entry.id, valueId, value, skipped));
      return;
    }
    run(() => submitCapture(entry.id, valueId, value, skipped));
  }

  async function perspectivePlease() {
    if (!entry) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      setEntry(await askPerspective(entry.id));
    } catch {
      // Her own answer was never waiting on this, so the card stays as it is.
      setError(NO_PERSPECTIVE);
    } finally {
      setBusy(false);
    }
  }

  // Fixed crisis content the engine put in the thread. It is shown as its own
  // card, and she moves on from it deliberately rather than scrolling past it.
  const crisisMessage = entry?.messages.find(
    m => m.kind === 'crisis' && !seenCrisis.includes(m.id),
  );

  function card() {
    if (!entry) {
      return (
        <View style={{paddingTop: 60, alignItems: 'center'}}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    if (crisisMessage) {
      return (
        <Flashcard cardKey={`crisis-${crisisMessage.id}`}>
          <Text style={{...type.body, color: colors.ink}}>{crisisMessage.content}</Text>
          <View style={{marginTop: 18}}>
            <PrimaryButton
              label="Continue"
              onPress={() => setSeenCrisis(ids => [...ids, crisisMessage.id])}
            />
          </View>
        </Flashcard>
      );
    }

    if (spec) {
      const prompt = [...entry.messages]
        .reverse()
        .find(m => m.kind === 'capture_prompt' && m.value_id === spec.value_id);

      return (
        <Flashcard cardKey={`${editing ? 'edit-' : ''}${spec.value_id}`} first={answered.length === 0}>
          <Text style={{...type.tiny, letterSpacing: 0.3}}>
            {editing ? 'CHANGING — ' : ''}
            {LABELS[spec.value_id]?.toUpperCase() ?? 'NEXT'}
          </Text>
          <Text style={{...type.heading, fontSize: 21, lineHeight: 28, marginTop: 8}}>
            {prompt?.content ?? ' '}
          </Text>

          {spec.control === 'scale' && spec.scale && (
            <View style={{marginTop: 18}}>
              <MoodScaleControl
                options={spec.scale}
                busy={busy}
                faces={spec.value_id === 'mood'}
                onSelect={value => answer(value)}
              />
            </View>
          )}

          {spec.control === 'multi_select' && spec.library && (
            <View style={{marginTop: 16}}>
              <LibraryPicker
                key={`${editing ?? ''}${spec.value_id}`}
                library={spec.library}
                preferValence={spec.prefer_valence}
                entryId={entry.id}
                selected={picked}
                onChange={setPicked}
                onCrisisEvent={(event: CrisisEvent) => {
                  if (event.tier === 'emergency') {
                    setEmergencyText(event.text);
                  }
                  answer(picked, picked.length === 0);
                }}
              />
              {/* Continue is pinned below the screen, not here: these lists are
                  long enough that an in-card button sits under the fold. */}
            </View>
          )}

          {spec.control === 'rating_set' && spec.rates && (
            <View style={{marginTop: 16}}>
              <RatingSetControl
                rates={spec.rates}
                value={ratings}
                onChange={setRatings}
                busy={busy}
              />
              <View style={{marginTop: 20}}>
                <PrimaryButton
                  label="Continue"
                  busy={busy}
                  onPress={() => {
                    const given = Object.keys(ratings).length > 0;
                    answer(given ? ratings : null, !given);
                  }}
                />
              </View>
            </View>
          )}

          {spec.control === 'free_text' && (
            <WritingCard
              spec={spec}
              text={text}
              setText={setText}
              expanded={expanded}
              setExpanded={setExpanded}
              busy={busy}
              onContinue={() => answer(text.trim() || null, !text.trim())}
              starters={
                journalType === 'savouring' && spec.value_id === 'event' && !editing
                  ? SAVING_STARTERS
                  : undefined
              }
              // Another way of reading the thought, if she asks for one. It is
              // labelled as Echo's and goes nowhere near her answer.
              perspective={
                spec.value_id === PERSPECTIVE_AT && !editing
                  ? {text: perspective?.content ?? null, onAsk: perspectivePlease}
                  : null
              }
            />
          )}
        </Flashcard>
      );
    }

    // Everything is answered: what she put down, read back to her, and open to
    // changes until Echo has read it.
    const canChange = !['active', 'closed'].includes(entry.conversation_status ?? '');
    return (
      <Flashcard cardKey="review">
        <Text style={{...type.heading, fontSize: 21}}>Here is what you put down</Text>
        <Text style={{...type.small, marginTop: 4}}>Already saved, as you went.</Text>

        <View style={{marginTop: 16}}>
          {[...latest.values()].map(message => (
            <View
              key={message.id}
              style={{borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 12}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: 12}}>
                <Text style={type.tiny}>{LABELS[message.value_id ?? ''] ?? 'Answer'}</Text>
                {canChange && seen.current[message.value_id ?? ''] && (
                  <Pressable
                    onPress={() => setEditing(message.value_id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Change ${LABELS[message.value_id ?? ''] ?? 'this answer'}`}>
                    <Text style={type.link}>Change</Text>
                  </Pressable>
                )}
              </View>
              <Text style={{...type.body, color: colors.ink, marginTop: 2}}>{message.content}</Text>
            </View>
          ))}
        </View>

        {closing && (
          <View
            style={{
              marginTop: 8,
              backgroundColor: colors.sageWash,
              borderRadius: radius.tile,
              padding: 14,
            }}>
            <Text style={type.body}>{closing.content}</Text>
          </View>
        )}

        {entry.support_note && (
          <Text style={{...type.small, marginTop: 12}}>{entry.support_note}</Text>
        )}

        <View style={{marginTop: 20, gap: 12}}>
          <PrimaryButton label="Done" onPress={onExit} />
          {entry.conversation_status === 'offered' && (
            <Pressable
              onPress={() => onContinueInThread(entry.id, journalType)}
              accessibilityRole="button"
              hitSlop={8}>
              <Text style={{...type.link, textAlign: 'center'}}>Talk it through with Echo</Text>
            </Pressable>
          )}
        </View>
      </Flashcard>
    );
  }

  // How far she has come, not how far is left. The server counts the steps this
  // entry will ask; where it cannot (a branch still open), the dots stand alone.
  const doneSteps = latest.size;
  const step = entry?.next_capture?.step ?? null;
  const total = entry?.next_capture?.total ?? null;
  const listStep = !editing && entry?.next_capture?.control === 'multi_select'
    ? entry.next_capture
    : null;
  const canGoBack = !editing && !crisisMessage && previousValue !== undefined
    && !['active', 'closed'].includes(entry?.conversation_status ?? '');

  return (
    <View style={{flex: 1}}>
      <ScreenBackground />
      <SafeAreaView style={{flex: 1}} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: space.screen,
            paddingTop: 6,
          }}>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            {canGoBack ? (
              <Pressable
                onPress={() => setEditing(previousValue)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Back to your last answer"
                style={{flexDirection: 'row', alignItems: 'center'}}>
                <ChevronLeft size={18} color={colors.inkSoft} />
                <Text style={{...type.small, color: colors.inkSoft}}>Back</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={editing ? () => setEditing(null) : leave}
                hitSlop={10}
                accessibilityRole="button"
                style={{flexDirection: 'row', alignItems: 'center'}}>
                {editing ? null : <ChevronLeft size={18} color={colors.inkSoft} />}
                <Text style={{...type.small, color: colors.inkSoft}}>
                  {editing ? 'Cancel' : 'Leave'}
                </Text>
              </Pressable>
            )}
          </View>
          <Text style={type.heading} accessibilityRole="header">
            {TITLES[journalType]}
          </Text>
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16}}>
            <Pressable
              onPress={quickExit}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close the app quickly">
              <EyeOff size={18} color={colors.inkSoft} />
            </Pressable>
            {/* FR-CRIS-009: crisis resources one tap away, here as everywhere. */}
            <Pressable onPress={() => setResourcesOpen(true)} hitSlop={10} accessibilityRole="button">
              <Text style={{...type.link, color: colors.alert}}>Get help</Text>
            </Pressable>
          </View>
        </View>

        {/* One dot per answer given, and a hollow one for the card she is on.
            The count beside them is the server's, so it is never a guess. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            paddingHorizontal: space.screen,
            paddingTop: 16,
            minHeight: 8,
          }}>
          {Array.from({length: doneSteps}).map((_, index) => (
            <View
              key={index}
              style={{width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.accent}}
            />
          ))}
          {entry?.next_capture && (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: colors.accentSoft,
              }}
            />
          )}
          {step !== null && total !== null && !editing && (
            <Text style={{...type.tiny, marginLeft: 6}}>{`Step ${step} of ${total}`}</Text>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.screen,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled">
          {entry && spec && !editing && !crisisMessage && answered.length === 0 ? (
            <Intro journal={journalType} />
          ) : null}
          {card()}

          {error ? (
            <View style={{marginTop: 16, ...shadow.sm}}>
              <Text style={{...type.small, color: colors.alert}}>{error}</Text>
              {error === SEND_FAILED && (
                <Pressable
                  onPress={() => retry.current && run(retry.current)}
                  hitSlop={8}
                  accessibilityRole="button">
                  <Text style={{...type.link, marginTop: 6}}>Try again</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </ScrollView>

        {/* A list can be longer than the screen, so its Continue stays on it. */}
        {listStep && (
          <View
            style={{
              paddingHorizontal: space.screen,
              paddingTop: 12,
              paddingBottom: 18,
              backgroundColor: colors.glass,
              borderTopWidth: 1,
              borderTopColor: colors.line,
            }}>
            <PrimaryButton
              label="Continue"
              busy={busy}
              onPress={() => answer(picked, picked.length === 0)}
            />
          </View>
        )}
      </SafeAreaView>

      {emergencyText !== null && (
        <CrisisResourcesScreen onClose={() => setEmergencyText(null)} />
      )}

      <Modal
        visible={resourcesOpen}
        animationType="slide"
        onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </View>
  );
}

function Intro({journal}: {journal: DeckJournal}) {
  const intro = INTROS[journal];
  return (
    <View
      style={{
        borderRadius: radius.card,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        marginBottom: 16,
        ...shadow.sm,
      }}>
      {intro.image ? (
        <Image
          source={intro.image}
          resizeMode="cover"
          accessible={false}
          style={{width: '100%', height: 118}}
        />
      ) : intro.art ? (
        <Illustration name={intro.art} height={118} />
      ) : null}
      <Text style={{...type.small, color: colors.inkSoft, textAlign: 'center', paddingVertical: 10}}>
        {intro.line}
      </Text>
    </View>
  );
}

// The ratings she gave these same feelings earlier, so the second pass starts
// from them and she adjusts rather than rates from nothing.
function carriedRatings(spec: CaptureSpec | null | undefined): Record<string, number> {
  return spec?.rates?.carried ? {...spec.rates.carried} : {};
}

type WritingProps = {
  spec: CaptureSpec;
  text: string;
  setText: (value: string) => void;
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  busy: boolean;
  onContinue: () => void;
  perspective: {text: string | null; onAsk: () => void} | null;
  // Optional ways to begin, offered while nothing is written yet.
  starters?: string[];
};

// A written answer: typed, or spoken and then read over. What she sends is
// always text she has seen, so crisis screening treats both the same.
function WritingCard({
  spec,
  text,
  setText,
  expanded,
  setExpanded,
  busy,
  onContinue,
  perspective,
  starters,
}: WritingProps) {
  const recorder = useVoiceNote(spoken => {
    const joined = text.trim() ? `${text.trimEnd()} ${spoken}` : spoken;
    setText(spec.max_length ? joined.slice(0, spec.max_length) : joined);
    setExpanded(true);
  });
  const speaking = recorder.phase !== 'idle';

  return (
    <View style={{marginTop: 16}}>
      {speaking ? (
        <RecordingBar
          phase={recorder.phase}
          seconds={recorder.seconds}
          onCancel={recorder.cancel}
          onDone={recorder.finish}
        />
      ) : (
        <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8}}>
          <TextInput
            value={text}
            onChangeText={value => {
              setText(value);
              recorder.clearError();
            }}
            onFocus={() => setExpanded(true)}
            multiline
            maxLength={spec.max_length ?? 2000}
            placeholder="However you want to put it."
            placeholderTextColor={colors.inkFaint}
            style={{
              ...type.input,
              flex: 1,
              color: colors.ink,
              backgroundColor: colors.surface,
              borderWidth: expanded ? 2 : 1,
              borderColor: expanded ? colors.accent : colors.line,
              borderRadius: radius.input,
              padding: 14,
              minHeight: expanded ? 150 : 80,
              textAlignVertical: 'top',
            }}
          />
          {spec.voice && <MicButton disabled={busy} onPress={recorder.start} />}
        </View>
      )}

      {recorder.error ? (
        <Text style={{...type.small, color: colors.alert, marginTop: 8}}>{recorder.error}</Text>
      ) : null}

      {starters && !speaking && !text.trim() ? (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12}}>
          {starters.map(starter => (
            <Pressable
              key={starter}
              onPress={() => {
                setText(`${starter}: `);
                setExpanded(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Start with: ${starter}`}
              style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                minHeight: 36,
                paddingHorizontal: 12,
                borderRadius: radius.pill,
                backgroundColor: pressed ? colors.accentWash : colors.sageWash,
              })}>
              <Plus size={13} color={colors.accent} />
              <Text style={{...type.small, fontFamily: font.semibold, color: colors.accent}}>
                {starter}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {perspective && (
        <View style={{marginTop: 14}}>
          {perspective.text ? (
            <View
              style={{
                backgroundColor: colors.sageWash,
                borderRadius: radius.tile,
                padding: 14,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Sparkles size={13} color={colors.inkSoft} />
                <Text style={type.tiny}>ECHO'S SUGGESTION — YOURS TO KEEP OR LEAVE</Text>
              </View>
              <Text style={{...type.body, marginTop: 6}}>{perspective.text}</Text>
            </View>
          ) : (
            <Pressable
              onPress={perspective.onAsk}
              disabled={busy}
              hitSlop={8}
              accessibilityRole="button"
              style={{flexDirection: 'row', alignItems: 'center', gap: 6, opacity: busy ? 0.5 : 1}}>
              <Sparkles size={14} color={colors.accent} />
              <Text style={type.link}>Help me explore another perspective</Text>
            </Pressable>
          )}
        </View>
      )}

      {!speaking && (
        <View style={{marginTop: 16}}>
          <PrimaryButton label="Continue" busy={busy} onPress={onContinue} />
        </View>
      )}
    </View>
  );
}
