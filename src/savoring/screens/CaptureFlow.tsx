import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AppState, Modal, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Heart} from 'lucide-react-native';

import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenBackground from '../../components/ScreenBackground';
import Chip from '../../components/chat/Chip';
import CrisisResourcesScreen from '../../screens/CrisisResourcesScreen';
import BreathingCircle from '../../calm/components/BreathingCircle';
import {PATTERNS, SessionState, initialState, tick} from '../../calm/hooks/useBreathingSession';
import {useReducedMotion} from '../../calm/hooks/useReducedMotion';
import {ApiError} from '../../api/client';
import {CrisisEvent, newClientId} from '../../api/entries';
import {LibraryItem, getLibrary} from '../../api/libraries';
import {markSlotDone} from '../../storage/reminders';
import {colors, radius, space, type} from '../../theme';
import {
  DayRoom,
  Moment,
  MomentContent,
  MomentMode,
  MomentType,
  editMoment,
  getPrefill,
  localDay,
  setFavorite,
} from '../api';
import {CAPTURE, CAP_MESSAGE, DONE, OFFLINE, PAUSE, SMALL_MOMENTS, TYPES, WHEN} from '../content';
import {saveOrQueue} from '../storage';
import ScoreScale from '../components/ScoreScale';
import {moodChange} from '../components/MomentCard';

type Step = 'what' | 'before' | 'feelings' | 'pause' | 'after';

type Props = {
  initialType: MomentType;
  mode: MomentMode;
  // Offer a deeper moment this time (after her first few quick ones).
  offerDeeper?: boolean;
  sourceEntryId?: string;
  editing?: Moment;
  room?: {today: DayRoom; yesterday: DayRoom};
  onClose: () => void;
  onDone: (moment: Moment | null) => void;
  onAnother: (type: MomentType) => void;
};

// Three slow breaths, in four and out six.
const PAUSE_SECONDS = 30;
const BREATH = PATTERNS.simple;

const splitTags = (text: string) =>
  text
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 3);

const daysBetween = (from: string, to: string) => {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

function SavorPause({prompt, note, onNote}: {prompt: string; note: string; onNote: (text: string) => void}) {
  const reduced = useReducedMotion();
  const [state, setState] = useState<SessionState>(() => ({...initialState(BREATH), status: 'running'}));

  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }
    const id = setInterval(() => setState(s => tick(s, BREATH, PAUSE_SECONDS)), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  // Leaving the app pauses the breaths; coming back carries on.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next =>
      setState(s =>
        next !== 'active' && s.status === 'running'
          ? {...s, status: 'paused'}
          : next === 'active' && s.status === 'paused'
            ? {...s, status: 'running'}
            : s,
      ),
    );
    return () => subscription.remove();
  }, []);

  const done = state.status === 'done';
  const phase = done ? null : BREATH[state.phaseIndex].kind;
  return (
    <View style={{alignItems: 'center'}}>
      <Text style={{...type.small, textAlign: 'center'}}>{PAUSE.hint}</Text>
      <View style={{marginVertical: 18}}>
        <BreathingCircle
          phase={phase}
          secondsLeft={state.secondsLeft}
          running={state.status === 'running'}
          reducedMotion={reduced}
          countdown={done ? null : state.secondsLeft}
          countdownLabel={`${phase === 'inhale' ? PAUSE.breatheIn : PAUSE.breatheOut}, ${state.secondsLeft}`}
        />
      </View>
      <Text style={{...type.label, color: colors.accent}} accessibilityLiveRegion="polite">
        {phase === 'inhale' ? PAUSE.breatheIn : phase === 'exhale' ? PAUSE.breatheOut : ' '}
      </Text>
      <Text style={{...type.heading, textAlign: 'center', marginTop: 18}}>{prompt}</Text>
      <TextInput
        value={note}
        onChangeText={onNote}
        maxLength={300}
        placeholder={PAUSE.notePlaceholder}
        placeholderTextColor={colors.inkFaint}
        accessibilityLabel={prompt}
        style={inputStyle}
      />
    </View>
  );
}

const inputStyle = {
  alignSelf: 'stretch' as const,
  marginTop: 12,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.input,
  paddingHorizontal: 14,
  paddingVertical: 12,
  ...type.input,
  color: colors.ink,
};

/**
 * Putting down one good moment. Quick: what happened, the mood before, the
 * good feelings, save (the mood after optional). Deeper: a pause to savor it,
 * then the mood after, what she did, what made it good and a souvenir line.
 * Nothing after "what happened" is required, and a low rating is just a rating.
 */
export default function CaptureFlow({
  initialType,
  mode: initialMode,
  offerDeeper = false,
  sourceEntryId,
  editing,
  room,
  onClose,
  onDone,
  onAnother,
}: Props) {
  const [kind, setKind] = useState<MomentType>(editing?.type ?? initialType);
  const [mode, setMode] = useState<MomentMode>(editing?.mode ?? initialMode);
  const [offer, setOffer] = useState(offerDeeper && !editing);
  const [stepIndex, setStepIndex] = useState(0);

  const [what, setWhat] = useState(editing?.what_happened ?? '');
  const [ideas, setIdeas] = useState(false);
  const [categories, setCategories] = useState<string[]>(editing?.categories.map(c => c.id) ?? []);
  const [people, setPeople] = useState(editing?.people.join(', ') ?? '');
  const [places, setPlaces] = useState(editing?.places.join(', ') ?? '');
  const [eventDate, setEventDate] = useState<string | null>(editing?.event_date ?? null);
  const todayFull = Boolean(room?.today.at_cap);
  const [yesterday, setYesterday] = useState(todayFull && !room?.yesterday.at_cap);
  const [moodBefore, setMoodBefore] = useState<number | null>(editing?.mood_before ?? null);
  const [emotions, setEmotions] = useState<Record<string, number | null>>(
    () => Object.fromEntries((editing?.emotions ?? []).map(e => [e.id, e.intensity])),
  );
  const [sensory, setSensory] = useState(editing?.sensory_note ?? '');
  const [moodAfter, setMoodAfter] = useState<number | null>(editing?.mood_after ?? null);
  const [showAfter, setShowAfter] = useState(editing?.mood_after != null);
  const [techniques, setTechniques] = useState<string[]>(editing?.techniques.map(t => t.id) ?? []);
  const [whyGood, setWhyGood] = useState(editing?.why_good ?? '');
  const [souvenir, setSouvenir] = useState(editing?.souvenir_line ?? '');
  const [expected, setExpected] = useState<number | null>(editing?.expected_rating ?? null);

  const [feelings, setFeelings] = useState<LibraryItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<LibraryItem[]>([]);
  const [techniqueItems, setTechniqueItems] = useState<LibraryItem[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{entry: Moment | null; day?: DayRoom; crisis: CrisisEvent | null} | null>(null);
  const [queued, setQueued] = useState(false);
  const [refusal, setRefusal] = useState('');
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const clientId = useRef(newClientId());
  const prompt = useMemo(() => PAUSE.prompts[Math.floor(Math.random() * PAUSE.prompts.length)], []);

  useEffect(() => {
    // Positive feelings only, her own words first; the libraries are cached after the first load.
    getLibrary('feelings', 'positive')
      .then(lib =>
        setFeelings(
          lib.categories.filter(c => c.id === 'my_words' || c.valence === 'positive').flatMap(c => c.items),
        ),
      )
      .catch(() => undefined);
    getLibrary('savoring_categories').then(lib => setCategoryItems(lib.categories.flatMap(c => c.items))).catch(() => undefined);
    getLibrary('savoring_techniques').then(lib => setTechniqueItems(lib.categories.flatMap(c => c.items))).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!sourceEntryId || editing) {
      return;
    }
    // Opened from a check-in: its good feelings start ticked, and stay hers to change.
    getPrefill(sourceEntryId)
      .then(ids => setEmotions(current => ({...Object.fromEntries(ids.map(id => [id, null])), ...current})))
      .catch(() => undefined);
  }, [sourceEntryId, editing]);

  const steps: Step[] = editing
    ? ['what', 'before', 'feelings', 'after']
    : mode === 'full'
      ? ['what', 'before', 'feelings', 'pause', 'after']
      : ['what', 'before', 'feelings'];
  const step = steps[stepIndex];
  const last = stepIndex === steps.length - 1;
  const day = editing?.local_date ?? (yesterday ? localDay(-1) : localDay());

  function toggle(list: string[], id: string, max = 99) {
    return list.includes(id) ? list.filter(x => x !== id) : list.length < max ? [...list, id] : list;
  }

  function content(): MomentContent {
    return {
      type: kind,
      what_happened: what.trim(),
      categories,
      people: splitTags(people),
      places: splitTags(places),
      mood_before: moodBefore,
      emotions,
      sensory_note: sensory.trim() || null,
      mood_after: moodAfter,
      techniques,
      why_good: whyGood.trim() || null,
      souvenir_line: souvenir.trim() || null,
      expected_rating: kind === 'anticipate' ? expected : null,
      event_date: kind === 'anticipate' ? eventDate : null,
    };
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      if (editing) {
        const result = await editMoment(editing.id, content());
        setSaved({entry: result.entry, crisis: result.crisis_event});
        onCrisis(result.crisis_event);
        return;
      }
      const result = await saveOrQueue({
        ...content(),
        client_id: clientId.current,
        mode,
        local_date: day,
        source_entry_id: sourceEntryId ?? null,
      });
      if (result === 'queued') {
        setQueued(true);
        return;
      }
      setSaved({entry: result.entry, day: result.day, crisis: result.crisis_event});
      onCrisis(result.crisis_event);
      // A moment saved today keeps the opt-in reminder quiet for the day.
      markSlotDone('savoring', result.entry.local_date);
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'daily_cap' || e.code === 'outside_window')) {
        setRefusal(e.message);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  function onCrisis(event: CrisisEvent | null) {
    if (event?.show_resources) {
      setResourcesOpen(true);
    }
  }

  function next() {
    if (last) {
      save();
    } else {
      setStepIndex(i => i + 1);
    }
  }

  // Skipping a step clears what was on it.
  function skip() {
    if (step === 'before') {
      setMoodBefore(null);
    } else if (step === 'feelings') {
      setEmotions({});
      setMoodAfter(null);
    } else if (step === 'pause') {
      setSensory('');
    } else if (step === 'after') {
      setMoodAfter(null);
      setTechniques([]);
      setWhyGood('');
      setSouvenir('');
      setExpected(null);
    }
    next();
  }

  function back() {
    if (saved || queued || refusal) {
      onDone(saved?.entry ?? null);
    } else if (stepIndex === 0) {
      onClose();
    } else {
      setStepIndex(i => i - 1);
    }
  }

  const header = (
    <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen, paddingVertical: 12}}>
      <BackButton onPress={back} />
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6}}>
        {!saved && !queued && !refusal
          ? steps.map((s, i) => (
              <View
                key={s}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: i <= stepIndex ? colors.accent : colors.muted,
                }}
              />
            ))
          : null}
      </View>
      <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
        <Text style={{...type.link, color: colors.alert}}>Get help</Text>
      </Pressable>
    </View>
  );

  const resources = (
    <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
      <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
    </Modal>
  );

  // ---- Done ----
  if (saved || queued || refusal) {
    const entry = saved?.entry ?? null;
    const change = entry ? moodChange(entry) : null;
    const full = saved?.day?.at_cap;
    return (
      <SafeAreaView style={{flex: 1}}>
        <ScreenBackground />
        {header}
        <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}>
          {refusal ? (
            <Text style={{...type.heading, marginTop: 20}}>{refusal}</Text>
          ) : (
            <>
              <Text accessibilityRole="header" style={{...type.title, marginTop: 12}}>
                {DONE.title}
              </Text>
              {queued ? <Text style={{...type.body, marginTop: 8}}>{OFFLINE.saved}</Text> : null}
              {change ? (
                <Text style={{...type.display, marginTop: 16}} accessibilityLabel={`${DONE.mood}: ${change.replace('→', 'to')}`}>
                  {change}
                </Text>
              ) : null}
              {change ? <Text style={type.small}>{DONE.mood}</Text> : null}
              {saved?.crisis?.text ? (
                <View style={{marginTop: 18, padding: 14, borderRadius: radius.tile, backgroundColor: colors.blush}}>
                  <Text style={{...type.body, color: colors.ink}}>{saved.crisis.text}</Text>
                  <Pressable onPress={() => setResourcesOpen(true)} style={{marginTop: 10}} accessibilityRole="button">
                    <Text style={type.link}>See support options</Text>
                  </Pressable>
                </View>
              ) : null}
              {entry && !editing ? (
                <Pressable
                  onPress={async () => {
                    const updated = await setFavorite(entry.id, !entry.is_favorite).catch(() => null);
                    if (updated) {
                      setSaved(s => (s ? {...s, entry: updated} : s));
                    }
                  }}
                  accessibilityRole="switch"
                  accessibilityState={{checked: entry.is_favorite}}
                  accessibilityLabel={DONE.favorite}
                  style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, minHeight: 44}}>
                  <Heart size={20} color={colors.alert} fill={entry.is_favorite ? colors.alert : 'transparent'} />
                  <Text style={type.label}>{entry.is_favorite ? DONE.favorited : DONE.favorite}</Text>
                </Pressable>
              ) : null}
            </>
          )}
          <View style={{marginTop: 24, gap: 12}}>
            <PrimaryButton label={DONE.finish} onPress={() => onDone(entry)} />
            {!editing && !refusal ? (
              full ? (
                <Text style={{...type.small, textAlign: 'center'}}>{CAP_MESSAGE}</Text>
              ) : (
                <Pressable onPress={() => onAnother(kind)} accessibilityRole="button" style={{paddingVertical: 10}}>
                  <Text style={{...type.link, textAlign: 'center'}}>{DONE.another}</Text>
                </Pressable>
              )
            ) : null}
          </View>
        </ScrollView>
        {resources}
      </SafeAreaView>
    );
  }

  // ---- Steps ----
  const selected = Object.keys(emotions);
  const nameOf = (id: string) => feelings.find(f => f.id === id)?.name ?? id;
  const canGo = step !== 'what' || what.trim().length > 0;

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      {header}
      <ScrollView
        contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}
        keyboardShouldPersistTaps="handled">
        {step === 'what' ? (
          <>
            {offer ? (
              <View style={{padding: 14, borderRadius: radius.tile, backgroundColor: colors.sageWash, marginBottom: 16}}>
                <Text style={{...type.body, color: colors.ink}}>{CAPTURE.goDeeper}</Text>
                <View style={{flexDirection: 'row', gap: 16, marginTop: 8}}>
                  <Pressable
                    onPress={() => {
                      setMode('full');
                      setOffer(false);
                    }}
                    accessibilityRole="button"
                    hitSlop={8}>
                    <Text style={type.link}>{CAPTURE.goDeeperYes}</Text>
                  </Pressable>
                  <Pressable onPress={() => setOffer(false)} accessibilityRole="button" hitSlop={8}>
                    <Text style={{...type.link, color: colors.inkFaint}}>{CAPTURE.goDeeperNo}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14}}>
              {TYPES.map(t => (
                <Chip key={t.id} label={t.chip} on={kind === t.id} onPress={() => setKind(t.id)} />
              ))}
            </View>
            <Text accessibilityRole="header" style={type.title}>
              {CAPTURE.what[kind]}
            </Text>
            <Text style={{...type.small, marginTop: 6}}>{CAPTURE.whatHint}</Text>
            <TextInput
              value={what}
              onChangeText={setWhat}
              multiline
              maxLength={500}
              placeholder={CAPTURE.whatPlaceholder}
              placeholderTextColor={colors.inkFaint}
              accessibilityLabel={CAPTURE.what[kind]}
              style={{...inputStyle, minHeight: 96, textAlignVertical: 'top'}}
            />
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12}}>
              {categoryItems.map(c => (
                <Chip key={c.id} label={c.name} on={categories.includes(c.id)} onPress={() => setCategories(l => toggle(l, c.id, 3))} />
              ))}
            </View>
            {!what.trim() ? (
              <Pressable onPress={() => setIdeas(v => !v)} accessibilityRole="button" style={{marginTop: 12}}>
                <Text style={type.link}>{CAPTURE.noIdeas}</Text>
              </Pressable>
            ) : null}
            {ideas && !what.trim() ? (
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
                {SMALL_MOMENTS.map(idea => (
                  <Chip key={idea} label={idea} on={false} onPress={() => setWhat(idea)} />
                ))}
              </View>
            ) : null}
            <View style={{flexDirection: 'row', gap: 10, marginTop: 14}}>
              <View style={{flex: 1}}>
                <Text style={type.small}>{CAPTURE.who}</Text>
                <TextInput value={people} onChangeText={setPeople} maxLength={120} placeholder={CAPTURE.tagPlaceholder}
                  placeholderTextColor={colors.inkFaint} accessibilityLabel={CAPTURE.who} style={{...inputStyle, marginTop: 6}} />
              </View>
              <View style={{flex: 1}}>
                <Text style={type.small}>{CAPTURE.where}</Text>
                <TextInput value={places} onChangeText={setPlaces} maxLength={120} placeholder={CAPTURE.tagPlaceholder}
                  placeholderTextColor={colors.inkFaint} accessibilityLabel={CAPTURE.where} style={{...inputStyle, marginTop: 6}} />
              </View>
            </View>
            {kind === 'anticipate' ? (
              <>
                <Text style={{...type.label, marginTop: 18}}>{CAPTURE.when}</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
                  {WHEN.map(w => {
                    const date = localDay(w.days + daysBetween(localDay(), day));
                    return (
                      <Chip key={w.label} label={w.label} on={eventDate === date}
                        onPress={() => setEventDate(eventDate === date ? null : date)} />
                    );
                  })}
                </View>
              </>
            ) : !editing && room && !room.yesterday.at_cap ? (
              <View style={{flexDirection: 'row', marginTop: 16}}>
                <Chip
                  label="It was yesterday"
                  on={yesterday}
                  onPress={() => {
                    // With today full, yesterday is the only day left.
                    if (!todayFull) {
                      setYesterday(v => !v);
                    }
                  }}
                />
              </View>
            ) : null}
          </>
        ) : null}

        {step === 'before' ? (
          <>
            <Text accessibilityRole="header" style={{...type.title, marginBottom: 18}}>
              {CAPTURE.moodBefore[kind]}
            </Text>
            <ScoreScale value={moodBefore} onChange={setMoodBefore} label="Mood before" />
          </>
        ) : null}

        {step === 'feelings' ? (
          <>
            <Text accessibilityRole="header" style={type.title}>
              {CAPTURE.emotions}
            </Text>
            <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{CAPTURE.emotionsHint}</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {feelings.map(f => (
                <Chip
                  key={f.id}
                  label={f.name}
                  on={f.id in emotions}
                  onPress={() =>
                    setEmotions(current =>
                      f.id in current
                        ? Object.fromEntries(Object.entries(current).filter(([id]) => id !== f.id))
                        : {...current, [f.id]: null},
                    )
                  }
                />
              ))}
            </View>
            {selected.map(id => (
              <View key={id} style={{marginTop: 18}}>
                <Text style={{...type.label, marginBottom: 8}}>How strong is {nameOf(id).toLowerCase()}?</Text>
                <ScoreScale
                  value={emotions[id]}
                  onChange={value => setEmotions(current => ({...current, [id]: value}))}
                  label={`How strong ${nameOf(id)} is`}
                  low="Hardly there"
                  high="As strong as it gets"
                />
              </View>
            ))}
            {mode === 'quick' && !editing ? (
              showAfter ? (
                <View style={{marginTop: 22}}>
                  <Text style={{...type.label, marginBottom: 8}}>{CAPTURE.moodAfterOptional}</Text>
                  <ScoreScale value={moodAfter} onChange={setMoodAfter} label="Mood now" />
                </View>
              ) : (
                <Pressable onPress={() => setShowAfter(true)} accessibilityRole="button" style={{marginTop: 22}}>
                  <Text style={type.link}>{CAPTURE.moodAfterOptional}</Text>
                </Pressable>
              )
            ) : null}
          </>
        ) : null}

        {step === 'pause' ? (
          <>
            <Text accessibilityRole="header" style={{...type.title, textAlign: 'center', marginBottom: 6}}>
              {PAUSE.title}
            </Text>
            <SavorPause prompt={prompt} note={sensory} onNote={setSensory} />
          </>
        ) : null}

        {step === 'after' ? (
          <>
            <Text accessibilityRole="header" style={{...type.title, marginBottom: 18}}>
              {CAPTURE.moodAfter}
            </Text>
            <ScoreScale value={moodAfter} onChange={setMoodAfter} label="Mood after" />
            <Text style={{...type.label, marginTop: 22, marginBottom: 8}}>{CAPTURE.techniques}</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {techniqueItems.map(t => (
                <Chip key={t.id} label={t.name} on={techniques.includes(t.id)} onPress={() => setTechniques(l => toggle(l, t.id))} />
              ))}
            </View>
            <Text style={{...type.label, marginTop: 22}}>{CAPTURE.whyGood}</Text>
            <TextInput value={whyGood} onChangeText={setWhyGood} multiline maxLength={500} placeholder={CAPTURE.optional}
              placeholderTextColor={colors.inkFaint} accessibilityLabel={CAPTURE.whyGood}
              style={{...inputStyle, minHeight: 70, textAlignVertical: 'top'}} />
            <Text style={{...type.label, marginTop: 18}}>{CAPTURE.souvenir}</Text>
            <TextInput value={souvenir} onChangeText={setSouvenir} maxLength={120} placeholder={CAPTURE.souvenirPlaceholder}
              placeholderTextColor={colors.inkFaint} accessibilityLabel={CAPTURE.souvenir} style={inputStyle} />
            {kind === 'anticipate' ? (
              <View style={{marginTop: 22}}>
                <Text style={{...type.label, marginBottom: 8}}>{CAPTURE.expected}</Text>
                <ScoreScale value={expected} onChange={setExpected} label="Expected" low="Not good" high="As good as it gets" />
              </View>
            ) : null}
          </>
        ) : null}

        {error ? <Text style={{...type.small, color: colors.alert, marginTop: 16}}>{error}</Text> : null}

        <View style={{marginTop: 26, gap: 12}}>
          <PrimaryButton
            label={busy ? CAPTURE.saving : last ? CAPTURE.save : step === 'pause' ? PAUSE.done : CAPTURE.next}
            onPress={next}
            busy={busy}
            disabled={!canGo}
          />
          {step !== 'what' ? (
            <Pressable onPress={skip} disabled={busy} accessibilityRole="button" style={{paddingVertical: 8}}>
              <Text style={{...type.link, color: colors.inkFaint, textAlign: 'center'}}>
                {step === 'pause' ? PAUSE.skip : CAPTURE.skip}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      {resources}
    </SafeAreaView>
  );
}
