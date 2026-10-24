import React, {useEffect, useRef, useState} from 'react';
import {Modal, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Heart} from 'lucide-react-native';

import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import ScoreScale from '../../components/ScoreScale';
import ScreenBackground from '../../components/ScreenBackground';
import Chip from '../../components/chat/Chip';
import {MicButton, RecordingBar, useVoiceNote} from '../../components/chat/VoiceNote';
import CrisisResourcesScreen from '../../screens/CrisisResourcesScreen';
import {CrisisEvent} from '../../api/entries';
import {LibraryItem, getLibrary} from '../../api/libraries';
import {colors, radius, space, type} from '../../theme';
import {
  RecordContent,
  RecordMode,
  Saved,
  ThoughtRecord,
  askQuestion,
  editRecord,
  getPrefill,
  setFavorite,
  suggestTraps,
} from '../api';
import {CRISIS, DONE, GENTLE, HELPERS, OFFLINE, STEPS} from '../content';
import {saveStep} from '../storage';

type Step =
  | 'situation'
  | 'emotions'
  | 'thought'
  | 'belief'
  | 'traps'
  | 'evidenceFor'
  | 'evidenceAgainst'
  | 'balanced'
  | 'rerate'
  | 'next';

type Props = {
  clientId: string;
  mode: RecordMode;
  content: RecordContent;
  step?: number;
  // The server's id once a step has reached it; needed to ask for help.
  recordId?: string | null;
  sourceEntryId?: string | null;
  // A finished record being changed.
  editing?: ThoughtRecord;
  asksEvidenceFor: boolean;
  situationRequired: boolean;
  onClose: () => void;
  onDone: () => void;
  onOpenSavoring?: () => void;
  onOpenGrounding?: () => void;
};

export function stepsFor(mode: RecordMode, asksEvidenceFor: boolean): Step[] {
  if (mode === 'quick') {
    return ['situation', 'emotions', 'thought', 'belief', 'balanced', 'rerate'];
  }
  return [
    'situation',
    'emotions',
    'thought',
    'belief',
    'traps',
    // The trauma variant leaves "what makes it feel true" out (FR-JRN-005).
    ...(asksEvidenceFor ? (['evidenceFor'] as Step[]) : []),
    'evidenceAgainst',
    'balanced',
    'rerate',
    'next',
  ];
}

const inputStyle = {
  ...type.input,
  flex: 1,
  color: colors.ink,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.input,
  padding: 14,
  minHeight: 90,
  textAlignVertical: 'top' as const,
};

// A text answer she can also speak; spoken words are added to what is there.
function VoiceField({
  value,
  onChange,
  label,
  placeholder,
  maxLength = 2000,
}: {
  value: string | null;
  onChange: (text: string) => void;
  label: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const recorder = useVoiceNote(spoken => {
    const joined = value?.trim() ? `${value.trimEnd()} ${spoken}` : spoken;
    onChange(joined.slice(0, maxLength));
  });
  if (recorder.phase !== 'idle') {
    return <RecordingBar phase={recorder.phase} seconds={recorder.seconds} onCancel={recorder.cancel} onDone={recorder.finish} />;
  }
  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8}}>
        <TextInput
          value={value ?? ''}
          onChangeText={text => {
            onChange(text);
            recorder.clearError();
          }}
          multiline
          maxLength={maxLength}
          placeholder={placeholder ?? 'However you want to put it.'}
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={label}
          style={inputStyle}
        />
        <MicButton disabled={false} onPress={recorder.start} />
      </View>
      {recorder.error ? <Text style={{...type.small, color: colors.alert, marginTop: 8}}>{recorder.error}</Text> : null}
    </>
  );
}

const text = (value: string | null) => (value && value.trim() ? value : null);

/**
 * One thought record, a step at a time. Each step is kept on the phone and
 * sent to the server (screened as it goes); offline, the phone's copy is
 * enough. Nothing ever calls the thought wrong, and the balanced thought is
 * hers to write.
 */
export default function RecordFlow({
  clientId,
  mode,
  content: initial,
  step: initialStep = 0,
  recordId: initialId = null,
  sourceEntryId = null,
  editing,
  asksEvidenceFor,
  situationRequired,
  onClose,
  onDone,
  onOpenSavoring,
  onOpenGrounding,
}: Props) {
  const steps = stepsFor(mode, asksEvidenceFor);
  const [index, setIndex] = useState(Math.min(initialStep, steps.length - 1));
  const [content, setContent] = useState<RecordContent>(initial);
  const [recordId, setRecordId] = useState<string | null>(editing?.id ?? initialId);
  const [feelings, setFeelings] = useState<LibraryItem[]>([]);
  const [tags, setTags] = useState<LibraryItem[]>([]);
  const [traps, setTraps] = useState<LibraryItem[]>([]);
  const [suggested, setSuggested] = useState<string[] | null>(null);
  const [asked, setAsked] = useState<Record<string, string>>({});
  const [helperTurn, setHelperTurn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [crisis, setCrisis] = useState<CrisisEvent | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [result, setResult] = useState<Saved | 'kept' | null>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    getLibrary('feelings').then(lib => setFeelings(lib.categories.flatMap(c => c.items))).catch(() => undefined);
    getLibrary('thought_situation_tags').then(lib => setTags(lib.categories.flatMap(c => c.items))).catch(() => undefined);
    getLibrary('thinking_traps').then(lib => setTraps(lib.categories.flatMap(c => c.items))).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!sourceEntryId || editing || prefilled.current || initial.emotions.length) {
      return;
    }
    prefilled.current = true;
    // Opened from a check-in: its feelings start ticked, and stay hers to change.
    getPrefill(sourceEntryId)
      .then(ids => setContent(c => ({...c, emotions: ids.map(feeling => ({feeling, before: null, after: null}))})))
      .catch(() => undefined);
  }, [sourceEntryId, editing, initial.emotions.length]);

  const step = steps[index];
  const last = index === steps.length - 1;
  const set = (patch: Partial<RecordContent>) => setContent(c => ({...c, ...patch}));
  const nameOf = (id: string) => feelings.find(f => f.id === id)?.name ?? id;
  const canGo =
    (step !== 'thought' || Boolean(text(content.automatic_thought))) &&
    (step !== 'situation' || !situationRequired || Boolean(text(content.situation)));

  function interrupt(saved: Saved) {
    if (saved.crisis_event?.show_resources) {
      setCrisis(saved.crisis_event);
    }
  }

  async function advance() {
    setError('');
    if (editing) {
      if (!last) {
        setIndex(i => i + 1);
        return;
      }
      setBusy(true);
      try {
        const saved = await editRecord(editing.id, content);
        interrupt(saved);
        setResult(saved);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      const saved = await saveStep({clientId, content, mode, step: last ? index : index + 1, sourceEntryId, complete: last});
      if (saved !== 'kept') {
        setRecordId(saved.record.id);
        interrupt(saved);
      }
      if (last) {
        setResult(saved);
      } else {
        setIndex(i => i + 1);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function helpMe(side: 'for' | 'against') {
    // The model's question when it is there; otherwise the next fixed one.
    const fixed = HELPERS[side][helperTurn % HELPERS[side].length];
    setHelperTurn(n => n + 1);
    let question: string | null = null;
    if (recordId) {
      question = await askQuestion(recordId, side).catch(() => null);
    }
    setAsked(a => ({...a, [side]: question ?? fixed}));
  }

  async function suggest() {
    const ids = recordId ? await suggestTraps(recordId).catch(() => null) : null;
    setSuggested(ids ?? []);
  }

  const header = (
    <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen, paddingVertical: 12}}>
      <BackButton onPress={() => (result || index === 0 ? (result ? onDone() : onClose()) : setIndex(i => i - 1))} />
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 5}}>
        {!result
          ? steps.map((s, i) => (
              <View key={s} style={{width: 7, height: 7, borderRadius: 4, backgroundColor: i <= index ? colors.accent : colors.muted}} />
            ))
          : null}
      </View>
      <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
        <Text style={{...type.link, color: colors.alert}}>Get help</Text>
      </Pressable>
    </View>
  );

  const modals = (
    <>
      {/* A flag: a gentle stop, the resources, and her choice whether to go on. */}
      <Modal visible={crisis !== null} transparent animationType="fade" onRequestClose={() => setCrisis(null)}>
        <View style={{flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(48, 38, 59, 0.35)'}}>
          <View style={{backgroundColor: colors.surface, borderRadius: radius.card, padding: 20}}>
            <Text style={{...type.body, color: colors.ink}}>{crisis?.text}</Text>
            <View style={{marginTop: 16, gap: 10}}>
              <PrimaryButton label={GENTLE.resources} onPress={() => setResourcesOpen(true)} />
              <Pressable onPress={() => setCrisis(null)} accessibilityRole="button" style={{paddingVertical: 8}}>
                <Text style={{...type.link, textAlign: 'center'}}>{CRISIS.continue}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCrisis(null);
                  onClose();
                }}
                accessibilityRole="button"
                style={{paddingVertical: 8}}>
                <Text style={{...type.link, color: colors.inkFaint, textAlign: 'center'}}>{CRISIS.stop}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </>
  );

  // ---- Done ----
  if (result) {
    const record = result === 'kept' ? null : result.record;
    const rated = content.emotions.filter(e => e.before !== null && e.after !== null);
    return (
      <SafeAreaView style={{flex: 1}}>
        <ScreenBackground />
        {header}
        <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}>
          <Text accessibilityRole="header" style={{...type.title, marginTop: 10}}>
            {DONE.title}
          </Text>
          {result === 'kept' ? <Text style={{...type.body, marginTop: 8}}>{OFFLINE.saved}</Text> : null}
          {content.belief_before !== null && content.belief_after !== null ? (
            <Text style={{...type.heading, marginTop: 16}}>{DONE.belief(content.belief_before, content.belief_after)}</Text>
          ) : null}
          {rated.map(e => (
            <Text key={e.feeling} style={{...type.body, color: colors.ink, marginTop: 4}}>
              {DONE.feeling(nameOf(e.feeling), e.before!, e.after!)}
            </Text>
          ))}
          {record ? (
            <Pressable
              onPress={async () => {
                const updated = await setFavorite(record.id, !record.is_favorite).catch(() => null);
                if (updated && result !== 'kept') {
                  setResult({...result, record: updated});
                }
              }}
              accessibilityRole="switch"
              accessibilityState={{checked: record.is_favorite}}
              accessibilityLabel={DONE.favorite}
              style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, minHeight: 44}}>
              <Heart size={20} color={colors.alert} fill={record.is_favorite ? colors.alert : 'transparent'} />
              <Text style={type.label}>{record.is_favorite ? DONE.favorited : DONE.favorite}</Text>
            </Pressable>
          ) : null}
          {result !== 'kept' && result.gentle ? (
            <View style={{marginTop: 18, padding: 14, borderRadius: radius.tile, backgroundColor: colors.blush}}>
              <Text style={{...type.body, color: colors.ink}}>{GENTLE.daily}</Text>
              {onOpenGrounding ? (
                <Pressable onPress={onOpenGrounding} accessibilityRole="button" style={{marginTop: 8, minHeight: 44, justifyContent: 'center'}}>
                  <Text style={type.link}>{GENTLE.grounding}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {result !== 'kept' && result.pattern ? (
            <View style={{marginTop: 18, padding: 14, borderRadius: radius.tile, backgroundColor: colors.surfaceRaised}}>
              <Text style={{...type.body, color: colors.ink}}>{GENTLE.pattern(result.pattern.tag, result.pattern.trap)}</Text>
              <Pressable onPress={() => setResourcesOpen(true)} accessibilityRole="button" style={{marginTop: 8, minHeight: 44, justifyContent: 'center'}}>
                <Text style={type.link}>{GENTLE.resources}</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={{marginTop: 24, gap: 12}}>
            <PrimaryButton label={DONE.finish} onPress={onDone} />
            {onOpenSavoring && !editing ? (
              <Pressable onPress={onOpenSavoring} accessibilityRole="button" style={{paddingVertical: 10}}>
                <Text style={{...type.link, textAlign: 'center'}}>{DONE.savoring}</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
        {modals}
      </SafeAreaView>
    );
  }

  // ---- Steps ----
  const chosen = content.emotions.map(e => e.feeling);
  const rate = (feeling: string, key: 'before' | 'after', value: number | null) =>
    set({emotions: content.emotions.map(e => (e.feeling === feeling ? {...e, [key]: value} : e))});

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      {header}
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}} keyboardShouldPersistTaps="handled">
        {step === 'situation' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>{STEPS.situation.title}</Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{STEPS.situation.hint}</Text>
            <VoiceField value={content.situation} onChange={v => set({situation: v})} label={STEPS.situation.title}
              placeholder={STEPS.situation.placeholder} />
            <Text style={{...type.label, marginTop: 16, marginBottom: 8}}>{STEPS.situation.tags}</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {tags.map(t => (
                <Chip key={t.id} label={t.name} on={content.situation_tags.includes(t.id)}
                  onPress={() => set({situation_tags: content.situation_tags.includes(t.id)
                    ? content.situation_tags.filter(x => x !== t.id) : [...content.situation_tags, t.id]})} />
              ))}
            </View>
          </>
        ) : null}

        {step === 'emotions' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>{STEPS.emotions.title}</Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{STEPS.emotions.hint}</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {feelings.map(f => (
                <Chip key={f.id} label={f.name} on={chosen.includes(f.id)}
                  onPress={() => set({emotions: chosen.includes(f.id)
                    ? content.emotions.filter(e => e.feeling !== f.id)
                    : [...content.emotions, {feeling: f.id, before: null, after: null}]})} />
              ))}
            </View>
            {content.emotions.map(e => (
              <View key={e.feeling} style={{marginTop: 18}}>
                <Text style={{...type.label, marginBottom: 8}}>{STEPS.emotions.strength(nameOf(e.feeling))}</Text>
                <ScoreScale value={e.before} onChange={v => rate(e.feeling, 'before', v)} step={10}
                  label={`${nameOf(e.feeling)} at the time`} low="Hardly there" high="As strong as it gets" />
              </View>
            ))}
          </>
        ) : null}

        {step === 'thought' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>{STEPS.thought.title}</Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{STEPS.thought.hint}</Text>
            <VoiceField value={content.automatic_thought} onChange={v => set({automatic_thought: v})}
              label={STEPS.thought.title} placeholder={STEPS.thought.placeholder} />
            <Text style={{...type.label, marginTop: 16, marginBottom: 8}}>{STEPS.thought.second}</Text>
            <VoiceField value={content.second_thought} onChange={v => set({second_thought: v})} label={STEPS.thought.second} />
          </>
        ) : null}

        {step === 'belief' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>{STEPS.belief.title}</Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 16}}>{STEPS.belief.hint}</Text>
            <ScoreScale value={content.belief_before} onChange={v => set({belief_before: v})} step={10} suffix="%"
              label="Belief in the thought" low="Not at all" high="Completely" />
          </>
        ) : null}

        {step === 'traps' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>{STEPS.traps.title}</Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 10}}>{STEPS.traps.hint}</Text>
            <Pressable onPress={suggest} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
              <Text style={type.link}>{STEPS.traps.suggest}</Text>
            </Pressable>
            {suggested ? (
              <Text style={{...type.small, marginBottom: 8}}>
                {suggested.length ? STEPS.traps.suggested : STEPS.traps.noSuggestion}
              </Text>
            ) : null}
            {traps.map(t => {
              const on = content.thinking_traps.includes(t.id);
              const hinted = suggested?.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => set({thinking_traps: on ? content.thinking_traps.filter(x => x !== t.id) : [...content.thinking_traps, t.id]})}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: on}}
                  accessibilityLabel={`${t.name}${hinted ? ', suggested' : ''}`}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: radius.tile,
                    borderWidth: 1.5,
                    borderColor: on ? colors.accent : hinted ? colors.accentSoft : colors.line,
                    backgroundColor: on ? colors.sageWash : colors.surface,
                  }}>
                  <Text style={type.label}>{t.name}{hinted ? '  · suggested' : ''}</Text>
                  {t.example ? <Text style={{...type.small, marginTop: 2}}>“{t.example}”</Text> : null}
                </Pressable>
              );
            })}
          </>
        ) : null}

        {step === 'evidenceFor' || step === 'evidenceAgainst' ? (
          (() => {
            const side = step === 'evidenceFor' ? 'for' : 'against';
            const copy = step === 'evidenceFor' ? STEPS.evidenceFor : STEPS.evidenceAgainst;
            const key = step === 'evidenceFor' ? 'evidence_for' : 'evidence_against';
            return (
              <>
                <Text accessibilityRole="header" style={type.title}>{copy.title}</Text>
                <Text style={{...type.small, marginTop: 6}}>{copy.hint}</Text>
                <View style={{marginTop: 10, marginBottom: 12}}>
                  {HELPERS[side].map(q => (
                    <Text key={q} style={{...type.small, marginTop: 4}}>• {q}</Text>
                  ))}
                </View>
                {asked[side] ? (
                  <View style={{padding: 12, borderRadius: radius.tile, backgroundColor: colors.sageWash, marginBottom: 12}}>
                    <Text style={{...type.body, color: colors.ink}}>{asked[side]}</Text>
                  </View>
                ) : null}
                <VoiceField value={content[key]} onChange={v => set({[key]: v} as Partial<RecordContent>)} label={copy.title} />
                <Pressable onPress={() => helpMe(side)} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center', marginTop: 6}}>
                  <Text style={type.link}>{HELPERS.helpMe}</Text>
                </Pressable>
              </>
            );
          })()
        ) : null}

        {step === 'balanced' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>{STEPS.balanced.title}</Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{STEPS.balanced.hint}</Text>
            {content.automatic_thought ? (
              <Text style={{...type.small, fontStyle: 'italic', marginBottom: 10}}>“{content.automatic_thought}”</Text>
            ) : null}
            <VoiceField value={content.balanced_thought} onChange={v => set({balanced_thought: v})}
              label={STEPS.balanced.title} placeholder={STEPS.balanced.placeholder} />
          </>
        ) : null}

        {step === 'rerate' ? (
          <>
            <Text accessibilityRole="header" style={{...type.title, marginBottom: 16}}>{STEPS.rerate.title}</Text>
            <Text style={{...type.label, marginBottom: 8}}>{STEPS.rerate.original}</Text>
            <ScoreScale value={content.belief_after} onChange={v => set({belief_after: v})} step={10} suffix="%"
              label="Belief in the first thought now" low="Not at all" high="Completely" />
            {text(content.balanced_thought) ? (
              <View style={{marginTop: 20}}>
                <Text style={{...type.label, marginBottom: 8}}>{STEPS.rerate.balanced}</Text>
                <ScoreScale value={content.balanced_belief} onChange={v => set({balanced_belief: v})} step={10} suffix="%"
                  label="Belief in the balanced thought" low="Not at all" high="Completely" />
              </View>
            ) : null}
            {content.emotions.length ? <Text style={{...type.label, marginTop: 22}}>{STEPS.rerate.feelings}</Text> : null}
            {content.emotions.map(e => (
              <View key={e.feeling} style={{marginTop: 12}}>
                <Text style={{...type.small, marginBottom: 6}}>
                  {nameOf(e.feeling)}{e.before !== null ? ` (was ${e.before})` : ''}
                </Text>
                <ScoreScale value={e.after} onChange={v => rate(e.feeling, 'after', v)} step={10}
                  label={`${nameOf(e.feeling)} now`} low="Hardly there" high="As strong as it gets" />
              </View>
            ))}
          </>
        ) : null}

        {step === 'next' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>{STEPS.next.title}</Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{STEPS.next.hint}</Text>
            <VoiceField value={content.next_step} onChange={v => set({next_step: v})} label={STEPS.next.title}
              placeholder={STEPS.next.placeholder} maxLength={500} />
          </>
        ) : null}

        {error ? <Text style={{...type.small, color: colors.alert, marginTop: 16}}>{error}</Text> : null}
        <View style={{marginTop: 26}}>
          <PrimaryButton label={last ? 'Finish' : 'Next'} onPress={advance} busy={busy} disabled={!canGo} />
        </View>
      </ScrollView>
      {modals}
    </SafeAreaView>
  );
}
