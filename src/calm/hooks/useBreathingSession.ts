import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';

export type PhaseKind = 'inhale' | 'hold' | 'exhale';
export type Phase = {kind: PhaseKind; seconds: number};
export type PatternId = 'box' | 'fourSevenEight' | 'simple';

export const PATTERNS: Record<PatternId, Phase[]> = {
  box: [
    {kind: 'inhale', seconds: 4},
    {kind: 'hold', seconds: 4},
    {kind: 'exhale', seconds: 4},
    {kind: 'hold', seconds: 4},
  ],
  fourSevenEight: [
    {kind: 'inhale', seconds: 4},
    {kind: 'hold', seconds: 7},
    {kind: 'exhale', seconds: 8},
  ],
  simple: [
    {kind: 'inhale', seconds: 4},
    {kind: 'exhale', seconds: 6},
  ],
};

export const PATTERN_IDS = Object.keys(PATTERNS) as PatternId[];
export const DURATIONS = [1, 3, 5] as const;
export type DurationMin = (typeof DURATIONS)[number];

export type Status = 'idle' | 'running' | 'paused' | 'done';
export type SessionState = {
  status: Status;
  phaseIndex: number;
  // Whole seconds left in the current phase.
  secondsLeft: number;
  // The breath being taken, counting from 1.
  cycle: number;
  elapsed: number;
};

export function initialState(pattern: Phase[]): SessionState {
  return {status: 'idle', phaseIndex: 0, secondsLeft: pattern[0].seconds, cycle: 1, elapsed: 0};
}

/**
 * One second of a session. Pure, so the timing can be tested without timers.
 * When the time is up the session ends at the end of the breath it is on,
 * never part-way through one.
 */
export function tick(state: SessionState, pattern: Phase[], totalSeconds: number): SessionState {
  if (state.status !== 'running') {
    return state;
  }
  const elapsed = state.elapsed + 1;
  if (state.secondsLeft > 1) {
    return {...state, elapsed, secondsLeft: state.secondsLeft - 1};
  }
  const next = state.phaseIndex + 1;
  if (next < pattern.length) {
    return {...state, elapsed, phaseIndex: next, secondsLeft: pattern[next].seconds};
  }
  if (elapsed >= totalSeconds) {
    return {...state, elapsed, secondsLeft: 0, status: 'done'};
  }
  return {...state, elapsed, phaseIndex: 0, secondsLeft: pattern[0].seconds, cycle: state.cycle + 1};
}

/**
 * The breathing exercise's behaviour: the chosen pattern and length, a
 * one-second timer, the phase and countdown, and the breath count.
 *
 * The timer only exists while the session is running, so pausing, stopping
 * and unmounting all clear it. Leaving the app pauses the session: a timer
 * that kept counting in the background would come back to a breath long over.
 */
export function useBreathingSession() {
  const [patternId, setPatternId] = useState<PatternId>('box');
  const [minutes, setMinutes] = useState<DurationMin>(1);
  const [state, setState] = useState<SessionState>(() => initialState(PATTERNS.box));

  const pattern = PATTERNS[patternId];
  const totalSeconds = minutes * 60;

  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }
    // ponytail: a pause drops the part-second already counted, so a session
    // can run up to a second longer per pause. Track milliseconds if that matters.
    const id = setInterval(() => setState(s => tick(s, pattern, totalSeconds)), 1000);
    return () => clearInterval(id);
  }, [state.status, pattern, totalSeconds]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') {
        setState(s => (s.status === 'running' ? {...s, status: 'paused'} : s));
      }
    });
    return () => subscription.remove();
  }, []);

  // The pattern and length can only change between sessions.
  const choosePattern = useCallback(
    (id: PatternId) => {
      if (state.status === 'running' || state.status === 'paused') {
        return;
      }
      setPatternId(id);
      setState(initialState(PATTERNS[id]));
    },
    [state.status],
  );

  const chooseMinutes = useCallback(
    (value: DurationMin) => {
      if (state.status === 'running' || state.status === 'paused') {
        return;
      }
      setMinutes(value);
      setState(initialState(pattern));
    },
    [state.status, pattern],
  );

  const start = useCallback(() => setState({...initialState(pattern), status: 'running'}), [pattern]);
  const pause = useCallback(
    () => setState(s => (s.status === 'running' ? {...s, status: 'paused'} : s)),
    [],
  );
  const resume = useCallback(
    () => setState(s => (s.status === 'paused' ? {...s, status: 'running'} : s)),
    [],
  );
  const stop = useCallback(() => setState(initialState(pattern)), [pattern]);

  return {
    patternId,
    minutes,
    choosePattern,
    chooseMinutes,
    status: state.status,
    phase: pattern[state.phaseIndex].kind,
    secondsLeft: state.secondsLeft,
    cycle: state.cycle,
    remainingSeconds: Math.max(0, totalSeconds - state.elapsed),
    // The time is up and the last breath is being finished.
    finishing: state.status === 'running' && state.elapsed >= totalSeconds,
    start,
    pause,
    resume,
    stop,
  };
}
