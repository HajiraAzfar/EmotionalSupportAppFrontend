import React, {useEffect, useRef, useState} from 'react';
import {AppState, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import ScoreScale from '../../components/ScoreScale';
import ScreenBackground from '../../components/ScreenBackground';
import VoiceField from '../../components/VoiceField';
import Chip from '../../components/chat/Chip';
import CalmModule from '../../calm/CalmModule';
import CrisisResourcesScreen from '../../screens/CrisisResourcesScreen';
import {CrisisEvent} from '../../api/entries';
import {LibraryItem, getLibrary} from '../../api/libraries';
import {localDay} from '../../savoring/api';
import {colors, radius, space, type} from '../../theme';
import {ExposureContent, ExposureMode, ExposureStatus, Ladder, Saved, getPrefill} from '../api';
import {BREAK, CRISIS, DONE, DURING, GENTLE, LADDER, OCCURRED, PLAN, REVIEW} from '../content';
import {saveStep, setPlanReminder} from '../storage';

type Phase = 'plan' | 'during' | 'review';
type PlanStep = 'step' | 'fear' | 'likelihood' | 'severity' | 'anxiety' | 'safety' | 'goal' | 'when';
type ReviewStep = 'did' | 'peakEnd' | 'happened' | 'occurred' | 'compare' | 'used' | 'learning' | 'next';

export function planSteps(mode: ExposureMode): PlanStep[] {
  return mode === 'quick'
    ? ['step', 'fear', 'anxiety']
    : ['step', 'fear', 'likelihood', 'severity', 'anxiety', 'safety', 'goal', 'when'];
}

export function reviewSteps(mode: ExposureMode, status: ExposureStatus): ReviewStep[] {
  // Set aside: nothing to rate; it is saved as it is, never as a failure.
  if (status === 'skipped') {
    return ['did'];
  }
  return mode === 'quick'
    ? ['did', 'peakEnd', 'occurred']
    : ['did', 'peakEnd', 'happened', 'occurred', 'compare', 'used', 'learning', 'next'];
}

type Props = {
  clientId: string;
  mode: ExposureMode;
  content: ExposureContent;
  status: ExposureStatus;
  phase?: Phase;
  step?: number;
  sourceEntryId?: string | null;
  ladders: Ladder[];
  onClose: () => void;
  onDone: () => void;
  onOpenLadders: () => void;
  onOpenSavoring?: () => void;
};

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * One exposure: the plan (a step, the prediction, what to drop, when), the
 * doing (a timer, optional anxiety notes, pause, grounding), and the review
 * (what happened against what was predicted). Every step is kept on the phone
 * and, online, on the server; pausing or stopping is always fine.
 */
export default function ExposureFlow({
  clientId,
  mode,
  content: initial,
  status: initialStatus,
  phase: initialPhase = 'plan',
  step: initialStep = 0,
  sourceEntryId = null,
  ladders,
  onClose,
  onDone,
  onOpenLadders,
  onOpenSavoring,
}: Props) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [index, setIndex] = useState(initialStep);
  const [content, setContent] = useState<ExposureContent>(initial);
  const [status, setStatus] = useState<ExposureStatus>(initialStatus);
  const [remind, setRemind] = useState(false);
  const [safety, setSafety] = useState<LibraryItem[]>([]);
  const [feelings, setFeelings] = useState<LibraryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [crisis, setCrisis] = useState<CrisisEvent | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [grounding, setGrounding] = useState(false);
  const [result, setResult] = useState<{saved: Saved | 'kept'; status: ExposureStatus} | null>(null);
  const [breakSaved, setBreakSaved] = useState(false);
  // During: seconds so far, whether paused, and whether the anxiety note is open.
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [noting, setNoting] = useState(false);
  const prefilled = useRef(false);

  useEffect(() => {
    getLibrary('safety_behaviours').then(lib => setSafety(lib.categories.flatMap(c => c.items))).catch(() => undefined);
    getLibrary('feelings').then(lib => setFeelings(lib.categories.flatMap(c => c.items))).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!sourceEntryId || prefilled.current || initial.feelings.length) {
      return;
    }
    prefilled.current = true;
    // Planned from a check-in or a thought record: its feelings start ticked.
    getPrefill(sourceEntryId).then(ids => setContent(c => ({...c, feelings: ids}))).catch(() => undefined);
  }, [sourceEntryId, initial.feelings.length]);

  // The timer runs only while she is doing it, not paused and in the app.
  useEffect(() => {
    if (phase !== 'during' || paused || grounding) {
      return;
    }
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase, paused, grounding]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => next !== 'active' && setPaused(true));
    return () => subscription.remove();
  }, []);

  const set = (patch: Partial<ExposureContent>) => setContent(c => ({...c, ...patch}));
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  const steps: string[] = phase === 'plan' ? planSteps(mode) : phase === 'review' ? reviewSteps(mode, status) : [];
  const step = steps[index];
  const lastPlan = phase === 'plan' && index === steps.length - 1;
  const lastReview = phase === 'review' && index === steps.length - 1;
  const allSteps = ladders.flatMap(l => l.steps.map(s => ({...s, fear: l.fear_name})));
  const chosen = allSteps.find(s => s.id === content.ladder_item_id);
  const canGo =
    (step !== 'step' || Boolean(content.ladder_item_id)) &&
    (step !== 'fear' || Boolean(content.feared_outcome?.trim())) &&
    (step !== 'did' || ['completed', 'partial', 'skipped'].includes(status));

  async function persist(nextStatus: ExposureStatus, nextPhase: Phase, nextStep: number) {
    setError('');
    setBusy(true);
    try {
      const saved = await saveStep({clientId, content, mode, status: nextStatus, phase: nextPhase === 'during' ? 'review' : nextPhase,
        step: nextStep, sourceEntryId});
      if (saved !== 'kept' && saved.crisis_event?.show_resources) {
        setCrisis(saved.crisis_event);
      }
      return saved;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  // What a step on the way is saved as: never backwards (a finished record
  // being corrected stays finished; a plan stays a plan).
  const finishedBefore = ['completed', 'partial', 'skipped'].includes(initialStatus);
  const along = (fallback: ExposureStatus): ExposureStatus =>
    finishedBefore ? initialStatus : initialStatus === 'planned' ? 'planned' : fallback;

  async function next() {
    if (phase === 'plan' && !lastPlan) {
      if (await persist(along('draft'), 'plan', index + 1)) {
        setIndex(i => i + 1);
      }
      return;
    }
    if (phase === 'plan' && mode === 'quick') {
      // Quick: the step is being repeated now; straight on to how it went.
      if (await persist(along('draft'), 'review', 0)) {
        setPhase('review');
        setIndex(0);
      }
      return;
    }
    if (phase === 'review' && !lastReview) {
      setIndex(i => i + 1);
      await persist(along('planned'), 'review', index + 1);
      return;
    }
    if (phase === 'review') {
      const saved = await persist(status, 'review', index);
      if (saved) {
        setResult({saved, status});
      }
    }
  }

  // The end of a full plan: do it now, or keep it for later (with a reminder if she wants one).
  async function savePlan(startNow: boolean) {
    const saved = await persist('planned', startNow ? 'during' : 'plan', 0);
    if (!saved) {
      return;
    }
    if (!startNow && remind && content.scheduled_for) {
      await setPlanReminder(clientId, content.scheduled_for);
    }
    if (startNow) {
      setStatus('planned');
      setPhase('during');
    } else {
      setResult({saved, status: 'planned'});
    }
  }

  function finishDuring() {
    const readings = content.anxiety_readings;
    set({
      anxiety_peak: content.anxiety_peak ?? (readings.length ? Math.max(...readings.map(r => r.suds)) : null),
      anxiety_end: content.anxiety_end ?? (readings.length ? readings[readings.length - 1].suds : null),
    });
    setPhase('review');
    setIndex(0);
  }

  // "Pause / I need a break": what she has so far is kept, and she leaves.
  async function takeBreak() {
    // A plan once made stays a plan; anything before that stays a draft.
    const madePlan = initialStatus === 'planned' || phase !== 'plan';
    const canPlan = Boolean(content.ladder_item_id && content.feared_outcome?.trim());
    await persist(madePlan && canPlan ? 'planned' : 'draft', phase === 'plan' ? 'plan' : 'review', index);
    setBreakSaved(true);
  }

  function back() {
    if (result || breakSaved) {
      onDone();
    } else if (phase === 'during') {
      setPaused(true);
    } else if (index > 0) {
      setIndex(i => i - 1);
    } else if (phase === 'review' && mode === 'quick') {
      setPhase('plan');
      setIndex(planSteps(mode).length - 1);
    } else {
      onClose();
    }
  }

  const header = (
    <View style={{paddingHorizontal: space.screen, paddingVertical: 12}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
        <BackButton onPress={back} />
        <View style={{flex: 1}} />
        <Pressable onPress={() => setGrounding(true)} hitSlop={12} accessibilityRole="button">
          <Text style={type.link}>{DURING.grounding}</Text>
        </Pressable>
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>
      {!result && !breakSaved ? (
        <Pressable onPress={takeBreak} disabled={busy} accessibilityRole="button"
          style={{alignSelf: 'flex-start', marginTop: 10, minHeight: 36, justifyContent: 'center'}}>
          <Text style={{...type.small, color: colors.accent}}>{BREAK.button}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const modals = (
    <>
      <Modal visible={crisis !== null} transparent animationType="fade" onRequestClose={() => setCrisis(null)}>
        <View style={{flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(46, 66, 50, 0.35)'}}>
          <View style={{backgroundColor: colors.surface, borderRadius: radius.card, padding: 20}}>
            <Text style={{...type.body, color: colors.ink}}>{crisis?.text}</Text>
            <View style={{marginTop: 16, gap: 10}}>
              <PrimaryButton label={GENTLE.resources} onPress={() => setResourcesOpen(true)} />
              <Pressable onPress={() => setCrisis(null)} accessibilityRole="button" style={{paddingVertical: 8}}>
                <Text style={{...type.link, textAlign: 'center'}}>{CRISIS.continue}</Text>
              </Pressable>
              <Pressable onPress={() => { setCrisis(null); onClose(); }} accessibilityRole="button" style={{paddingVertical: 8}}>
                <Text style={{...type.link, color: colors.inkFaint, textAlign: 'center'}}>{CRISIS.stop}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
      {/* Grounding is always one tap away, and the exposure waits where it was. */}
      <Modal visible={grounding} animationType="slide" onRequestClose={() => setGrounding(false)}>
        <CalmModule initial="groundYourself" onExit={() => setGrounding(false)} />
      </Modal>
    </>
  );

  const frame = (body: React.ReactNode) => (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      {header}
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}} keyboardShouldPersistTaps="handled">
        {body}
        {error ? <Text style={{...type.small, color: colors.alert, marginTop: 16}}>{error}</Text> : null}
      </ScrollView>
      {modals}
    </SafeAreaView>
  );

  // ---- a break, or done ----
  if (breakSaved) {
    return frame(
      <>
        <Text style={{...type.title, marginTop: 10}}>{BREAK.saved}</Text>
        <View style={{marginTop: 24}}>
          <PrimaryButton label={DONE.finish} onPress={onDone} />
        </View>
      </>,
    );
  }
  if (result) {
    const saved = result.saved === 'kept' ? null : result.saved;
    const title = result.status === 'completed' ? DONE.completed : result.status === 'partial' ? DONE.partial
      : result.status === 'skipped' ? DONE.skipped : DONE.planned;
    return frame(
      <>
        <Text accessibilityRole="header" style={{...type.title, marginTop: 10}}>{title}</Text>
        {result.saved === 'kept' ? <Text style={{...type.body, marginTop: 8}}>Saved on this phone; it will be sent when you're online.</Text> : null}
        {content.predicted_likelihood !== null && content.outcome_occurred ? (
          <Text style={{...type.body, color: colors.ink, marginTop: 14}}>
            {DONE.likely(content.predicted_likelihood, OCCURRED[content.outcome_occurred])}
          </Text>
        ) : null}
        {content.predicted_anxiety !== null && content.anxiety_peak !== null && result.status !== 'planned' ? (
          <Text style={{...type.body, color: colors.ink, marginTop: 6}}>{DONE.anxiety(content.predicted_anxiety, content.anxiety_peak)}</Text>
        ) : null}
        {saved?.gentle ? (
          <View style={{marginTop: 16, padding: 14, borderRadius: radius.tile, backgroundColor: colors.blush}}>
            <Text style={{...type.body, color: colors.ink}}>{GENTLE.daily}</Text>
          </View>
        ) : null}
        {saved?.pattern ? (
          <View style={{marginTop: 16, padding: 14, borderRadius: radius.tile, backgroundColor: colors.surfaceRaised}}>
            <Text style={{...type.body, color: colors.ink}}>{GENTLE.pattern(saved.pattern.step)}</Text>
            <Pressable onPress={() => setResourcesOpen(true)} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
              <Text style={type.link}>{GENTLE.resources}</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={{marginTop: 24, gap: 12}}>
          <PrimaryButton label={DONE.finish} onPress={onDone} />
          {onOpenSavoring && result.status !== 'planned' ? (
            <Pressable onPress={onOpenSavoring} accessibilityRole="button" style={{paddingVertical: 10}}>
              <Text style={{...type.link, textAlign: 'center'}}>{DONE.savoring}</Text>
            </Pressable>
          ) : null}
        </View>
      </>,
    );
  }

  // ---- during ----
  if (phase === 'during') {
    return frame(
      <>
        <Text accessibilityRole="header" style={{...type.title, marginTop: 6}}>{DURING.title}</Text>
        {chosen ? <Text style={{...type.body, marginTop: 4}}>{chosen.description}</Text> : null}
        <Text style={{...type.small, marginTop: 10}}>{DURING.hint}</Text>
        <Text style={{...type.display, fontSize: 48, textAlign: 'center', marginVertical: 28}}
          accessibilityLabel={`${Math.floor(elapsed / 60)} minutes ${elapsed % 60} seconds`}>
          {mmss(elapsed)}
        </Text>
        {noting ? (
          <ScoreScale value={null} step={10} label={DURING.check} low="Calm" high="As anxious as it gets"
            onChange={v => {
              if (v !== null) {
                set({anxiety_readings: [...content.anxiety_readings, {minute: Math.floor(elapsed / 60), suds: v}]});
              }
              setNoting(false);
            }} />
        ) : (
          <Pressable onPress={() => setNoting(true)} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
            <Text style={{...type.link, textAlign: 'center'}}>{DURING.checkButton}</Text>
          </Pressable>
        )}
        {content.anxiety_readings.length ? (
          <Text style={{...type.small, textAlign: 'center', marginTop: 8}}>
            {content.anxiety_readings.map(r => `${r.minute}m: ${r.suds}`).join('  ·  ')}
          </Text>
        ) : null}
        <View style={{flexDirection: 'row', gap: 10, marginTop: 24}}>
          <Pressable onPress={() => setPaused(p => !p)} accessibilityRole="button"
            style={{flex: 1, minHeight: 48, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.accent,
              alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{...type.label, color: colors.accent}}>{paused ? DURING.resume : DURING.pause}</Text>
          </Pressable>
          <View style={{flex: 1}}>
            <PrimaryButton label={DURING.finish} onPress={finishDuring} />
          </View>
        </View>
      </>,
    );
  }

  // ---- plan and review steps ----
  const occurredLabel = content.outcome_occurred ? OCCURRED[content.outcome_occurred] : null;
  return frame(
    <>
      <View style={{flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 14}}>
        {steps.map((s, i) => (
          <View key={s} style={{width: 7, height: 7, borderRadius: 4, backgroundColor: i <= index ? colors.accent : colors.muted}} />
        ))}
      </View>

      {step === 'step' ? (
        <>
          <Text accessibilityRole="header" style={type.title}>{PLAN.step}</Text>
          <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{LADDER.start}</Text>
          {!ladders.length ? (
            <>
              <Text style={type.body}>{PLAN.noLadder}</Text>
              <View style={{marginTop: 12}}>
                <PrimaryButton label="Build a fear ladder" onPress={onOpenLadders} />
              </View>
            </>
          ) : (
            ladders.map(l => (
              <View key={l.id} style={{marginBottom: 14}}>
                <Text style={{...type.label, marginBottom: 6}}>{l.fear_name}</Text>
                {l.steps.map(s => {
                  const on = content.ladder_item_id === s.id;
                  return (
                    <Pressable key={s.id} onPress={() => set({ladder_item_id: s.id})} accessibilityRole="radio"
                      accessibilityState={{checked: on}}
                      accessibilityLabel={`${s.description}, expected ${s.expected_suds}${s.suggested_start ? ', a good place to start' : ''}`}
                      style={{padding: 12, marginBottom: 6, borderRadius: radius.tile, borderWidth: 1.5,
                        borderColor: on ? colors.accent : s.suggested_start ? colors.accentSoft : colors.line,
                        backgroundColor: on ? colors.sageWash : colors.surface}}>
                      <Text style={type.label}>{s.description}</Text>
                      <Text style={type.small}>
                        {LADDER.expected(s.expected_suds)}{s.attempts ? ` · tried ${s.attempts}` : ''}{s.suggested_start ? ' · a good start' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </>
      ) : null}

      {step === 'fear' ? (
        <>
          <Text accessibilityRole="header" style={type.title}>{PLAN.fear}</Text>
          <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{PLAN.fearHint}</Text>
          <VoiceField value={content.feared_outcome} onChange={v => set({feared_outcome: v})} label={PLAN.fear} />
          {content.feelings.length || sourceEntryId ? (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14}}>
              {feelings.filter(f => content.feelings.includes(f.id)).map(f => (
                <Chip key={f.id} label={f.name} on onPress={() => set({feelings: toggle(content.feelings, f.id)})} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {step === 'likelihood' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 16}}>{PLAN.likelihood}</Text>
          <ScoreScale value={content.predicted_likelihood} onChange={v => set({predicted_likelihood: v})} step={10} suffix="%"
            label="How likely" low="Won't happen" high="Certain" />
        </>
      ) : null}

      {step === 'severity' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 16}}>{PLAN.severity}</Text>
          <ScoreScale value={content.predicted_severity} onChange={v => set({predicted_severity: v})} step={10}
            label="How bad" low="Not bad" high="As bad as it gets" />
        </>
      ) : null}

      {step === 'anxiety' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 16}}>{PLAN.anxiety}</Text>
          <ScoreScale value={content.predicted_anxiety} onChange={v => set({predicted_anxiety: v})} step={10}
            label="Expected anxiety" low="Calm" high="As anxious as it gets" />
        </>
      ) : null}

      {step === 'safety' || step === 'used' ? (
        <>
          <Text accessibilityRole="header" style={type.title}>{step === 'safety' ? PLAN.safety : REVIEW.used}</Text>
          <Text style={{...type.small, marginTop: 6, marginBottom: 12}}>{step === 'safety' ? PLAN.safetyHint : REVIEW.usedHint}</Text>
          {safety.map(b => {
            const key = step === 'safety' ? 'safety_behaviors_planned' : 'safety_behaviors_used';
            const on = content[key].includes(b.id);
            return (
              <Pressable key={b.id} onPress={() => set({[key]: toggle(content[key], b.id)} as Partial<ExposureContent>)}
                accessibilityRole="checkbox" accessibilityState={{checked: on}} accessibilityLabel={b.name}
                style={{padding: 12, marginBottom: 6, borderRadius: radius.tile, borderWidth: 1.5,
                  borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.sageWash : colors.surface}}>
                <Text style={type.label}>{b.name}</Text>
                {b.example ? <Text style={type.small}>{b.example}</Text> : null}
              </Pressable>
            );
          })}
        </>
      ) : null}

      {step === 'goal' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 12}}>{PLAN.goal}</Text>
          <VoiceField value={content.learning_goal} onChange={v => set({learning_goal: v})} label={PLAN.goal}
            placeholder={PLAN.goalPlaceholder} maxLength={500} />
        </>
      ) : null}

      {step === 'when' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 12}}>{PLAN.when}</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            <Chip label={PLAN.now} on={!content.scheduled_for} onPress={() => set({scheduled_for: null})} />
            {PLAN.times.map(t => {
              const at = `${localDay(t.days)}T${String(t.hour).padStart(2, '0')}:00`;
              return <Chip key={t.label} label={t.label} on={content.scheduled_for === at} onPress={() => set({scheduled_for: at})} />;
            })}
          </View>
          {content.scheduled_for ? (
            <View style={{flexDirection: 'row', marginTop: 14}}>
              <Chip label={PLAN.reminder} on={remind} onPress={() => setRemind(r => !r)} />
            </View>
          ) : null}
          <View style={{marginTop: 26, gap: 12}}>
            {!content.scheduled_for ? <PrimaryButton label={PLAN.start} onPress={() => savePlan(true)} busy={busy} /> : null}
            <Pressable onPress={() => savePlan(false)} disabled={busy} accessibilityRole="button" style={{paddingVertical: 10}}>
              <Text style={{...type.link, textAlign: 'center'}}>{PLAN.savePlan}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 'did' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 14}}>{REVIEW.did}</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            {REVIEW.didOptions.map(o => (
              <Chip key={o.id} label={o.label} on={status === o.id} onPress={() => setStatus(o.id)} />
            ))}
          </View>
          {initialStatus === 'planned' && mode === 'full' && !elapsed ? (
            <Pressable onPress={() => setPhase('during')} accessibilityRole="button" style={{marginTop: 18, minHeight: 44, justifyContent: 'center'}}>
              <Text style={type.link}>{REVIEW.startNow}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {step === 'peakEnd' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 14}}>{REVIEW.peak}</Text>
          <ScoreScale value={content.anxiety_peak} onChange={v => set({anxiety_peak: v})} step={10}
            label="Peak anxiety" low="Calm" high="As anxious as it gets" />
          <Text style={{...type.label, marginTop: 20, marginBottom: 8}}>{REVIEW.end}</Text>
          <ScoreScale value={content.anxiety_end} onChange={v => set({anxiety_end: v})} step={10}
            label="Anxiety at the end" low="Calm" high="As anxious as it gets" />
        </>
      ) : null}

      {step === 'happened' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 12}}>{REVIEW.happened}</Text>
          <VoiceField value={content.what_happened} onChange={v => set({what_happened: v})} label={REVIEW.happened} />
        </>
      ) : null}

      {step === 'occurred' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 6}}>{REVIEW.occurred}</Text>
          {content.feared_outcome ? <Text style={{...type.small, fontStyle: 'italic', marginBottom: 12}}>“{content.feared_outcome}”</Text> : null}
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            {REVIEW.occurredOptions.map(o => (
              <Chip key={o.id} label={o.label} on={content.outcome_occurred === o.id} onPress={() => set({outcome_occurred: o.id})} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'compare' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 14}}>{REVIEW.compare}</Text>
          {content.predicted_likelihood !== null ? (
            <Text style={{...type.body, color: colors.ink}}>
              {occurredLabel ? DONE.likely(content.predicted_likelihood, occurredLabel) : `You predicted ${content.predicted_likelihood}% likely.`}
            </Text>
          ) : null}
          {content.predicted_anxiety !== null && content.anxiety_peak !== null ? (
            <Text style={{...type.body, color: colors.ink, marginTop: 8}}>{DONE.anxiety(content.predicted_anxiety, content.anxiety_peak)}</Text>
          ) : null}
        </>
      ) : null}

      {step === 'learning' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 12}}>{REVIEW.learning}</Text>
          <VoiceField value={content.learning} onChange={v => set({learning: v})} label={REVIEW.learning} />
        </>
      ) : null}

      {step === 'next' ? (
        <>
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 14}}>{REVIEW.next}</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            {REVIEW.nextOptions.map(o => (
              <Chip key={o.id} label={o.label} on={content.next_step === o.id} onPress={() => set({next_step: content.next_step === o.id ? null : o.id})} />
            ))}
          </View>
        </>
      ) : null}

      {step !== 'when' ? (
        <View style={{marginTop: 26}}>
          <PrimaryButton label={lastReview ? REVIEW.save : 'Next'} onPress={next} busy={busy} disabled={!canGo} />
        </View>
      ) : null}
    </>,
  );
}
