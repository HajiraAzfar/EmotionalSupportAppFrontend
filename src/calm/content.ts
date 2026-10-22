// Every word the Calm module shows, in one place, so it can be edited or
// translated without touching a component.
//
// The app's own screens are written in English (Roman Urdu is Echo's, in its
// replies), so this is English. A translation is a second object of the same
// shape, picked where the screens import `calm`.
//
// DRAFT_NOT_CLINICALLY_APPROVED: the exercise wording below has not been
// reviewed by the clinical advisor. (release_check.py only scans the backend,
// so this marker is a reminder, not a gate.)

export const calm = {
  // The card on the home screen that opens the module.
  entry: {
    title: 'Calm',
    blurb: 'Breathing and grounding, a few minutes at a time.',
  },
  common: {
    back: 'Back',
  },
  home: {
    title: 'Calm',
    intro: 'A few quiet minutes to slow down. Nothing here is saved or sent.',
    safety: 'If you feel unsafe or in crisis, contact a local helpline or someone you trust.',
    exercises: {
      breathing: {
        title: 'Breathing',
        blurb: 'Follow a circle as it grows and shrinks. 1, 3 or 5 minutes.',
      },
      senses: {
        title: '5-4-3-2-1',
        blurb: 'Use your senses to come back to the room around you.',
      },
      feet: {
        title: 'Feet on the floor',
        blurb: 'Five gentle steps to feel steady where you are.',
      },
    },
  },
  breathing: {
    title: 'Breathing',
    patternLabel: 'Pattern',
    durationLabel: 'Length',
    // The timer never cuts a breath short, so every length is approximate.
    durationNote: 'Lengths are approximate: when the time is up, the breath you are on is finished first.',
    patterns: {
      box: {name: 'Box', detail: 'In 4 · hold 4 · out 4 · hold 4'},
      fourSevenEight: {name: '4-7-8', detail: 'In 4 · hold 7 · out 8'},
      simple: {name: 'Simple', detail: 'In 4 · out 6'},
    },
    durations: {
      1: 'About 1 min',
      3: 'About 3 min',
      5: 'About 5 min',
    },
    phases: {
      inhale: 'Breathe in',
      hold: 'Hold',
      exhale: 'Breathe out',
    },
    ready: 'Press Start when you are ready.',
    paused: 'Paused',
    // "Breath 3 · 0:42 left", or "Breath 5 · finishing this breath" once the time is up.
    progress: (breath: number, secondsLeft: number, finishing: boolean) =>
      `Breath ${breath} · ${
        finishing
          ? 'finishing this breath'
          : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')} left`
      }`,
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    a11y: {
      start: 'Start the breathing exercise',
      pause: 'Pause the breathing exercise',
      resume: 'Resume the breathing exercise',
      stop: 'Stop and reset the breathing exercise',
      seconds: (n: number) => `${n} seconds`,
    },
  },
  grounding: {
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    exercises: {
      senses: {
        title: '5-4-3-2-1',
        steps: [
          {
            title: '5 things you can see',
            prompt: 'Look around slowly. Name five things you can see, big or small.',
          },
          {
            title: '4 things you can feel',
            prompt: 'Notice four things you can feel: your clothes, the seat under you, the air on your skin.',
          },
          {
            title: '3 things you can hear',
            prompt: 'Listen for three sounds, near or far. Let each one come and go.',
          },
          {
            title: '2 things you can smell',
            prompt: 'Find two things you can smell. If nothing comes, think of two smells you like.',
          },
          {
            title: '1 thing you can taste',
            prompt: 'Notice one thing you can taste, or take a slow sip of water.',
          },
        ],
      },
      feet: {
        title: 'Feet on the floor',
        steps: [
          {
            title: 'Settle',
            prompt: 'Sit or stand comfortably and let both feet rest flat on the floor.',
          },
          {
            title: 'Feel the floor',
            prompt: 'Notice the weight of your feet pressing down. The floor is holding you up.',
          },
          {
            title: 'Press gently',
            prompt: 'Press your feet into the floor a little, then let go. Do this two more times.',
          },
          {
            title: 'One slow breath',
            prompt: 'Breathe in gently, then let a longer breath out.',
          },
          {
            title: 'Look around',
            prompt: 'Name one thing you can see, and remind yourself where you are right now.',
          },
        ],
      },
    },
  },
  done: {
    title: 'Well done',
    body: 'Take a moment to notice how you feel now. You can come back to this any time.',
    again: 'Do it again',
    back: 'Back',
  },
};
