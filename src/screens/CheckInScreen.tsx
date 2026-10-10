import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {EyeOff} from 'lucide-react-native';

import ErrorBoundary from '../components/ErrorBoundary';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import Chip from '../components/chat/Chip';
import MessageBubble from '../components/chat/MessageBubble';
import MoodScaleControl from '../components/chat/MoodScaleControl';
import SupportCard from '../components/chat/SupportCard';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {
  CheckInDraft,
  CheckInResult,
  clearDraft,
  FactorItem,
  Factors,
  getFactors,
  loadDraft,
  newDraft,
  saveDraft,
  submitCheckIn,
} from '../api/checkIn';
import {addTerm, TERM_MAX_LENGTH} from '../api/libraries';
import {quickExit} from '../storage/appLock';
import {colors, radius, space, type} from '../theme';

// Step 1 is app-owned, fixed text: no model, no network.
const MOOD_SCALE = [
  {value: 1, label: 'Very low'},
  {value: 2, label: 'Low'},
  {value: 3, label: 'Okay'},
  {value: 4, label: 'Good'},
  {value: 5, label: 'Very good'},
];
const INITIAL_PER_CATEGORY = 4;
const NOTE_MAX = 2000;
const SEND_FAILED = "Couldn't send that. Your answer is saved. Tap to try again.";
// Used only if the chips could not load, so the step still reads right.
const FALLBACK_PROMPT = "What's behind this mood?";

type Props = {
  // A mood tapped on the home card: the check-in opens at step 2.
  startMood?: number;
  onExit: () => void;
  onOpenChat?: () => void;
};

const matches = (item: FactorItem, q: string) =>
  [item.label, item.label_ur, item.label_roman].some(l => l.toLowerCase().includes(q));

// The daily check-in: mood → what's behind it → note → Echo's closing reply.
// Chips are a local selection; everything is sent once, at the end.
function CheckIn({startMood, onExit, onOpenChat}: Props) {
  const [saved, setDraft] = useState<CheckInDraft | null>(null);
  const [factors, setFactors] = useState<Factors | null>(null);
  const [factorsFailed, setFactorsFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [emergencyText, setEmergencyText] = useState<string | null>(null);

  // Pick up an unsent check-in where she left it; otherwise start fresh.
  useEffect(() => {
    loadDraft().then(stored => {
      if (stored && stored.sync === 'pending' && stored.mood !== null) {
        setDraft({...stored, step: stored.step === 'sending' ? 'note' : stored.step});
      } else {
        setDraft(newDraft(startMood ?? null));
      }
    });
  }, [startMood]);

  useEffect(() => {
    if (saved && saved.step !== 'done' && saved.mood !== null) {
      saveDraft(saved);
    }
  }, [saved]);

  const mood = saved?.mood ?? null;
  function loadFactors() {
    if (mood === null) {
      return;
    }
    setFactorsFailed(false);
    getFactors(mood).then(setFactors).catch(() => setFactorsFailed(true));
  }
  useEffect(loadFactors, [mood]);

  const allItems = useMemo(() => factors?.categories.flatMap(c => c.items) ?? [], [factors]);
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allItems.filter(i => matches(i, q)) : null;
  }, [allItems, query]);

  if (!saved) {
    return <ActivityIndicator color={colors.sage} style={{marginTop: 80}} />;
  }
  const draft = saved;

  const update = (patch: Partial<CheckInDraft>) => setDraft(d => (d ? {...d, ...patch} : d));
  const toggle = (id: string) =>
    update({factors: draft.factors.includes(id) ? draft.factors.filter(x => x !== id) : [...draft.factors, id]});
  const labelOf = (id: string) => allItems.find(i => i.id === id)?.label ?? '';

  async function send(current: CheckInDraft) {
    setSendFailed(false);
    update({step: 'sending'});
    try {
      const done = await submitCheckIn(current);
      setResult(done);
      update({step: 'done', sync: 'synced'});
      await clearDraft();
      if (done.crisis_event?.tier === 'emergency') {
        setEmergencyText(done.crisis_event.text);
      }
    } catch {
      // Whatever went wrong, she sees the same calm line; the draft is on the phone.
      setSendFailed(true);
      update({step: 'note'});
    }
  }

  async function saveTerm() {
    const name = (newTerm || query).trim();
    if (!name || mood === null) {
      return;
    }
    try {
      const added = await addTerm('triggers', name);
      setFactors(await getFactors(mood));
      update({factors: draft.factors.includes(added.term.id) ? draft.factors : [...draft.factors, added.term.id]});
      setNewTerm('');
      setQuery('');
      setAdding(false);
      if (added.crisis_event?.tier === 'emergency') {
        setEmergencyText(added.crisis_event.text);
      }
    } catch {
      Alert.alert("Couldn't add that", 'Check your internet and try again.');
    }
  }

  // One way out. Mid-way, she chooses whether what she gave is kept.
  function close() {
    if (draft.step === 'done' || draft.mood === null) {
      onExit();
      return;
    }
    Alert.alert('Save or discard?', 'You can save what you have so far, or leave without saving.', [
      {text: 'Keep going', style: 'cancel'},
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await clearDraft();
          onExit();
        },
      },
      {text: 'Save', onPress: () => send(draft)},
    ]);
  }

  function renderFactors() {
    if (factorsFailed) {
      return (
        <Pressable onPress={loadFactors} style={{paddingVertical: 8}}>
          <Text style={{...type.small, color: colors.alert}}>
            Couldn't load the options. Tap to try again, or just continue.
          </Text>
        </Pressable>
      );
    }
    if (!factors) {
      return <ActivityIndicator color={colors.sage} />;
    }
    return (
      <View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.inkFaint}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.input,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 12,
            ...type.input,
            color: colors.ink,
          }}
        />

        {draft.factors.length > 0 && (
          <View style={{marginBottom: 6}}>
            <Text style={{...type.small, marginBottom: 6}}>Selected ({draft.factors.length})</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {draft.factors.map(id => (
                <Chip key={id} label={labelOf(id)} on removable onPress={() => toggle(id)} />
              ))}
            </View>
          </View>
        )}

        {found ? (
          <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            {found.map(item => (
              <Chip key={item.id} label={item.label} on={draft.factors.includes(item.id)} onPress={() => toggle(item.id)} />
            ))}
            {found.length === 0 && (
              <Pressable onPress={saveTerm} style={{paddingVertical: 10}}>
                <Text style={type.link}>+ Add “{query.trim().slice(0, TERM_MAX_LENGTH)}” as your own</Text>
              </Pressable>
            )}
          </View>
        ) : (
          factors.categories.map(category => {
            const open = expanded.includes(category.id);
            const shown = open ? category.items : category.items.slice(0, INITIAL_PER_CATEGORY);
            const hidden = category.items.length - shown.length;
            return (
              <View key={category.id} style={{marginBottom: 6}}>
                <Text style={{...type.small, marginBottom: 6}}>{category.label}</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center'}}>
                  {shown.map(item => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      on={draft.factors.includes(item.id)}
                      onPress={() => toggle(item.id)}
                    />
                  ))}
                  {hidden > 0 && (
                    <Pressable
                      onPress={() => setExpanded(e => [...e, category.id])}
                      style={{minHeight: 44, justifyContent: 'center', paddingHorizontal: 10}}>
                      <Text style={type.link}>+{hidden} more</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}

        {!found &&
          (adding ? (
            <View style={{flexDirection: 'row', gap: 8, marginBottom: 10}}>
              <TextInput
                value={newTerm}
                onChangeText={setNewTerm}
                maxLength={TERM_MAX_LENGTH}
                autoFocus
                placeholder="Your own word"
                placeholderTextColor={colors.inkFaint}
                onSubmitEditing={saveTerm}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: radius.input,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  ...type.input,
                  color: colors.ink,
                }}
              />
              <Pressable onPress={saveTerm} style={{justifyContent: 'center', paddingHorizontal: 8}}>
                <Text style={{...type.label, color: colors.accent}}>Add</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setAdding(true)} style={{paddingVertical: 10}}>
              <Text style={type.link}>+ Add your own</Text>
            </Pressable>
          ))}
      </View>
    );
  }

  function renderStep() {
    switch (draft.step) {
      case 'mood':
        return (
          <>
            <Text style={{...type.title, marginBottom: 20}}>How are you feeling right now?</Text>
            <MoodScaleControl options={MOOD_SCALE} busy={false} onSelect={v => update({mood: v, step: 'factors', factors: []})} />
          </>
        );
      case 'factors':
        return (
          <>
            <Text style={{...type.title, marginBottom: 16}}>{factors?.prompt.en ?? FALLBACK_PROMPT}</Text>
            {renderFactors()}
          </>
        );
      case 'note':
      case 'sending':
        return (
          <>
            <Text style={{...type.title, marginBottom: 16}}>
              {factors?.note_prompt.en ?? "Anything you'd like to add?"}
            </Text>
            <TextInput
              value={draft.note}
              onChangeText={note => update({note})}
              maxLength={NOTE_MAX}
              multiline
              editable={draft.step !== 'sending'}
              placeholder="Optional"
              placeholderTextColor={colors.inkFaint}
              style={{
                minHeight: 120,
                textAlignVertical: 'top',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.input,
                padding: 14,
                ...type.input,
                color: colors.ink,
              }}
            />
            {sendFailed && (
              <Pressable onPress={() => send(draft)} style={{paddingTop: 12}} accessibilityRole="button">
                <Text style={{...type.small, color: colors.alert}}>{SEND_FAILED}</Text>
              </Pressable>
            )}
          </>
        );
      case 'done':
        return (
          <>
            {result ? (
              <>
                <MessageBubble
                  message={{
                    id: 'closing',
                    role: 'ai',
                    kind: 'closing',
                    value_id: null,
                    content: result.closing,
                    sequence: 1,
                    created_at: '',
                  }}
                />
                {result.card ? <SupportCard prominent={result.card === 'prominent'} /> : null}
              </>
            ) : null}
            {result?.suggest === 'chat' && onOpenChat && (
              <Pressable onPress={onOpenChat} style={{paddingVertical: 8}}>
                <Text style={type.link}>Want to talk it through? Open Chat</Text>
              </Pressable>
            )}
          </>
        );
    }
  }

  const step = draft.step;
  const continueLabel =
    step === 'factors' && draft.factors.length ? `Continue (${draft.factors.length} selected)` : step === 'done' ? 'Done' : 'Continue';

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen, paddingVertical: 12}}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
          <Text style={{...type.link, color: colors.inkSoft}}>{step === 'mood' ? 'Not now' : 'Close'}</Text>
        </Pressable>
        <Text style={{...type.heading, flex: 1, textAlign: 'center'}}>Check-in</Text>
        {/* Quick exit: one tap to a neutral page, the PIN on return. What she entered stays on the phone. */}
        <Pressable
          onPress={() => {
            onExit();
            quickExit();
          }}
          hitSlop={12}
          accessibilityLabel="Quick exit"
          style={{marginRight: 16}}>
          <EyeOff size={18} color={colors.inkSoft} />
        </Pressable>
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{paddingHorizontal: space.screen, paddingTop: 16, paddingBottom: 24}}>
          {renderStep()}
        </ScrollView>

        {/* Always enabled: continuing with nothing chosen is how a step is left empty. */}
        {step !== 'mood' && (
          <View style={{paddingHorizontal: space.screen, paddingVertical: 12, backgroundColor: colors.bg}}>
            <PrimaryButton
              label={continueLabel}
              busy={step === 'sending'}
              onPress={() => {
                if (step === 'factors') {
                  update({step: 'note'});
                } else if (step === 'note') {
                  send(draft);
                } else if (step === 'done') {
                  onExit();
                }
              }}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={resourcesOpen && !emergencyText} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
      {/* FR-CRIS-007: emergency content stays until she acknowledges it. */}
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

export default function CheckInScreen(props: Props) {
  return (
    <ErrorBoundary>
      <CheckIn {...props} />
    </ErrorBoundary>
  );
}
