/**
 * The Calm module: the breathing timer's phases, breaths and end; pausing when
 * the app leaves the foreground; timers cleared on unmount; the grounding
 * steps; and Android's back button inside the module. The circle's native
 * animation can only be judged on a device.
 */
import React from 'react';
import {AppState, BackHandler, StyleSheet, Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import CalmModule from '../src/calm/CalmModule';
import {
  initialState,
  PATTERNS,
  Phase,
  SessionState,
  tick,
  useBreathingSession,
} from '../src/calm/hooks/useBreathingSession';
import {useGroundingFlow} from '../src/calm/hooks/useGroundingFlow';
import {ACTIVITIES, matchActivities} from '../src/calm/hooks/useGroundYourself';

const {act} = ReactTestRenderer;

function run(pattern: Phase[], totalSeconds: number, seconds: number): SessionState {
  let state: SessionState = {...initialState(pattern), status: 'running'};
  for (let i = 0; i < seconds; i++) {
    state = tick(state, pattern, totalSeconds);
  }
  return state;
}

describe('tick', () => {
  it('walks box breathing through its four phases and counts breaths', () => {
    expect(run(PATTERNS.box, 60, 3)).toMatchObject({phaseIndex: 0, secondsLeft: 1});
    expect(run(PATTERNS.box, 60, 4)).toMatchObject({phaseIndex: 1, secondsLeft: 4});
    expect(run(PATTERNS.box, 60, 12)).toMatchObject({phaseIndex: 3, secondsLeft: 4});
    expect(run(PATTERNS.box, 60, 16)).toMatchObject({phaseIndex: 0, cycle: 2});
  });

  it('times 4-7-8 as in 4, hold 7, out 8', () => {
    expect(run(PATTERNS.fourSevenEight, 60, 4)).toMatchObject({phaseIndex: 1, secondsLeft: 7});
    expect(run(PATTERNS.fourSevenEight, 60, 11)).toMatchObject({phaseIndex: 2, secondsLeft: 8});
    expect(run(PATTERNS.fourSevenEight, 60, 19)).toMatchObject({phaseIndex: 0, cycle: 2});
  });

  it('finishes the breath it is on when the time is up', () => {
    // Box at 1 minute: 60s falls inside the fourth 16s breath, which ends at 64s.
    expect(run(PATTERNS.box, 60, 60).status).toBe('running');
    expect(run(PATTERNS.box, 60, 63).status).toBe('running');
    expect(run(PATTERNS.box, 60, 64)).toMatchObject({status: 'done', cycle: 4});
    // 4-7-8 at 3 minutes: ten 19s breaths, 190s.
    expect(run(PATTERNS.fourSevenEight, 180, 189).status).toBe('running');
    expect(run(PATTERNS.fourSevenEight, 180, 190)).toMatchObject({status: 'done', cycle: 10});
    // Simple at 1 minute ends exactly on time: six 10s breaths.
    expect(run(PATTERNS.simple, 60, 60)).toMatchObject({status: 'done', cycle: 6});
  });

  it('does nothing unless running', () => {
    const paused: SessionState = {...initialState(PATTERNS.box), status: 'paused'};
    expect(tick(paused, PATTERNS.box, 60)).toBe(paused);
  });
});

describe('useBreathingSession', () => {
  let session: ReturnType<typeof useBreathingSession>;
  function Probe() {
    session = useBreathingSession();
    return null;
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('pauses when the app leaves the foreground and clears its timer on unmount', () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(<Probe />);
    });
    act(() => session.start());
    act(() => jest.advanceTimersByTime(4000));
    expect(session).toMatchObject({status: 'running', phase: 'hold', secondsLeft: 4});

    // Changing the pattern mid-session is ignored.
    act(() => session.choosePattern('simple'));
    expect(session.patternId).toBe('box');

    const calls = (AppState.addEventListener as jest.Mock).mock.calls;
    const onChange = calls[calls.length - 1][1];
    act(() => onChange('background'));
    expect(session.status).toBe('paused');
    act(() => jest.advanceTimersByTime(10000));
    expect(session.secondsLeft).toBe(4);

    act(() => session.resume());
    act(() => jest.advanceTimersByTime(1000));
    expect(session.secondsLeft).toBe(3);
    expect(jest.getTimerCount()).toBe(1);

    act(() => root.unmount());
    expect(jest.getTimerCount()).toBe(0);
  });

  it('stops back to the start', () => {
    act(() => {
      ReactTestRenderer.create(<Probe />);
    });
    act(() => session.start());
    act(() => jest.advanceTimersByTime(6000));
    act(() => session.stop());
    expect(session).toMatchObject({status: 'idle', phase: 'inhale', secondsLeft: 4, cycle: 1});
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('useGroundingFlow', () => {
  let flow: ReturnType<typeof useGroundingFlow<string>>;
  function Probe() {
    flow = useGroundingFlow(['a', 'b', 'c']);
    return null;
  }

  it('steps forward and back, finishes, and restarts', () => {
    act(() => {
      ReactTestRenderer.create(<Probe />);
    });
    expect(flow).toMatchObject({index: 0, step: 'a', isFirst: true, done: false});
    act(() => flow.previous());
    expect(flow.index).toBe(0);
    act(() => flow.next());
    act(() => flow.next());
    expect(flow).toMatchObject({step: 'c', isLast: true});
    act(() => flow.previous());
    expect(flow.step).toBe('b');
    act(() => flow.next());
    act(() => flow.next());
    expect(flow).toMatchObject({done: true, step: null});
    act(() => flow.restart());
    expect(flow).toMatchObject({index: 0, step: 'a', done: false});
  });
});

describe('matchActivities', () => {
  const ids = (need: Parameters<typeof matchActivities>[1], time: Parameters<typeof matchActivities>[2]) =>
    matchActivities(ACTIVITIES, need, time).map(a => a.id);

  it('keeps what fits the feeling and the time, shortest first', () => {
    expect(ids('any', 0)).toHaveLength(ACTIVITIES.length);
    expect(ids('low', 1)).toEqual(['affirmations']);
    expect(ids('anxious', 3)).toEqual(['breathing', 'feet', 'affirmations', 'senses']);
    expect(ids('disconnected', 5)).toContain('bodyScan');
    expect(ids('disconnected', 5)).not.toContain('pmr');
  });

  it('always has something for every feeling at the shortest time', () => {
    for (const need of ['anxious', 'overwhelmed', 'low', 'disconnected'] as const) {
      expect(ids(need, 1).length).toBeGreaterThan(0);
    }
  });
});

describe('CalmModule', () => {
  const flatten = (c: any): string =>
    Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
  const allText = (root: ReactTestInstance) =>
    root.findAllByType(Text).map(t => flatten(t.props.children));
  const textOf = (n: ReactTestInstance) => allText(n).join(' ');
  const pressable = (root: ReactTestInstance, label: string) =>
    root.findAll(n => typeof n.props.onPress === 'function' && textOf(n).includes(label))[0];

  it('opens an exercise, and the back button returns to Calm before leaving', async () => {
    let backHandler: () => boolean = () => false;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      backHandler = handler as () => boolean;
      return {remove: jest.fn()};
    });
    const onExit = jest.fn();

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<CalmModule onExit={onExit} />);
    });
    expect(allText(root.root)).toContain(
      'If you feel unsafe or in crisis, contact a local helpline or someone you trust.',
    );

    await act(async () => pressable(root.root, '5-4-3-2-1').props.onPress());
    expect(allText(root.root)).toContain('Step 1 of 5');
    await act(async () => pressable(root.root, 'Next').props.onPress());
    expect(allText(root.root)).toContain('Step 2 of 5');

    await act(async () => {
      expect(backHandler()).toBe(true);
    });
    expect(allText(root.root)).toContain('5-4-3-2-1');
    expect(onExit).not.toHaveBeenCalled();

    await act(async () => {
      backHandler();
    });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('Ground yourself filters by feeling and time, and Back returns to that list', async () => {
    let backHandler: () => boolean = () => false;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      backHandler = handler as () => boolean;
      return {remove: jest.fn()};
    });
    const onExit = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<CalmModule onExit={onExit} initial="groundYourself" />);
    });
    const radio = (label: string) =>
      root.root.findAll(n => n.props.accessibilityLabel === label && n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function')[0];

    await act(async () => radio('Low').props.onPress());
    await act(async () => radio('1 min').props.onPress());
    const text = allText(root.root);
    expect(text).toContain('Kind words');
    expect(text).not.toContain('Mindful breathing');

    await act(async () => pressable(root.root, 'Kind words').props.onPress());
    expect(allText(root.root)).toContain('Step 1 of 5');

    await act(async () => {
      backHandler();
    });
    expect(allText(root.root)).toContain('I feel');
    await act(async () => {
      backHandler();
    });
    expect(allText(root.root)).toContain('Exercises');
    await act(async () => {
      backHandler();
    });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('runs the breathing screen through Start, a phase change and Pause', async () => {
    jest.useFakeTimers();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<CalmModule onExit={jest.fn()} />);
    });
    await act(async () => pressable(root.root, 'Breathing').props.onPress());
    expect(allText(root.root)).toContain('About 3 min');
    // The circle fills its box; without that it has no size and never shows.
    const circle = root.root.findAll(n => n.props.importantForAccessibility === 'no-hide-descendants')[0];
    expect(StyleSheet.flatten(circle.props.style)).toMatchObject({position: 'absolute', top: 0, bottom: 0});

    await act(async () => pressable(root.root, 'Start').props.onPress());
    expect(allText(root.root)).toContain('Breathe in');
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(allText(root.root)).toContain('Hold');
    expect(allText(root.root)).toContain('Breath 1 · 0:56 left');

    await act(async () => pressable(root.root, 'Pause').props.onPress());
    expect(allText(root.root)).toContain('Paused');
    expect(allText(root.root)).toContain('Resume');

    await act(async () => root.unmount());
    jest.useRealTimers();
  });
});
