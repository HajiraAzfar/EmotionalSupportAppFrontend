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
  // The home screen's quick tools that open the module.
  entry: {
    title: 'Calm',
    blurb: 'Breathing and grounding, a few minutes at a time.',
    grounding: 'Grounding',
    groundYourself: 'Ground yourself',
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
      bodyScan: {
        title: 'Body scan',
        blurb: 'Move your attention slowly through your body, from feet to face.',
      },
      pmr: {
        title: 'Release tension',
        blurb: 'Tense and let go, one part of the body at a time (progressive muscle relaxation).',
      },
    },
    groundYourself: {
      title: 'Ground yourself',
      blurb: 'Not sure what you need? Choose by how you feel and the time you have.',
    },
    exercisesLabel: 'Exercises',
  },
  // Short activities for heavy moments, picked by need and by time.
  groundYourself: {
    title: 'Ground yourself',
    intro: 'Pick how you feel and how much time you have. Every activity can be stopped at any point.',
    needLabel: 'I feel',
    timeLabel: 'I have',
    needs: {
      any: 'Anything',
      anxious: 'Anxious',
      overwhelmed: 'Overwhelmed',
      low: 'Low',
      disconnected: 'Disconnected',
    },
    times: {
      0: 'Any time',
      1: '1 min',
      3: '3 min',
      5: '5 min',
    },
    // "Notice your surroundings · about 3 min"
    meta: (blurb: string, minutes: number) => `${blurb} · about ${minutes} min`,
    none: 'Nothing that short fits this feeling. Try a little more time.',
    activities: {
      breathing: {title: 'Mindful breathing', blurb: 'Slow your breath with a guide'},
      senses: {title: 'Notice your surroundings', blurb: 'The 5-4-3-2-1 senses walk'},
      feet: {title: 'Feet on the floor', blurb: 'Feel steady where you are'},
      movement: {title: 'Gentle movement', blurb: 'Loosen up, slowly'},
      affirmations: {title: 'Kind words', blurb: 'A few lines to say to yourself'},
      support: {title: 'Reach for support', blurb: 'Think of someone you can turn to'},
      bodyScan: {title: 'Body scan', blurb: 'Rest your attention, feet to face'},
      pmr: {title: 'Release tension', blurb: 'Tense, then let go'},
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
      bodyScan: {
        title: 'Body scan',
        steps: [
          {
            title: 'Get comfortable',
            prompt: 'Sit or lie down. Let your eyes close, or rest your gaze on one spot.',
          },
          {
            title: 'Feet and legs',
            prompt: 'Bring your attention to your feet, then slowly up your legs. Notice warmth, weight or tingling. Nothing needs to change.',
          },
          {
            title: 'Belly and chest',
            prompt: 'Notice your belly and chest rising and falling as you breathe.',
          },
          {
            title: 'Hands and arms',
            prompt: 'Move your attention to your hands, then your arms. Let them feel heavy.',
          },
          {
            title: 'Shoulders, neck and face',
            prompt: 'If something feels tight, breathe out slowly and let it soften a little.',
          },
          {
            title: 'Your whole body',
            prompt: 'Feel your whole body at once, resting here. Open your eyes when you are ready.',
          },
        ],
      },
      pmr: {
        title: 'Release tension',
        steps: [
          {
            title: 'Before you start',
            prompt: 'Find a comfortable seat. You will tense each part for about five seconds, then let go. Skip any part that hurts or is injured.',
          },
          {
            title: 'Hands',
            prompt: 'Make fists and squeeze gently. Hold, then let go, and notice the difference.',
          },
          {
            title: 'Arms and shoulders',
            prompt: 'Bend your arms and lift your shoulders towards your ears. Hold, then let them drop.',
          },
          {
            title: 'Face',
            prompt: 'Scrunch your face gently: eyes, nose and mouth. Hold, then soften everything.',
          },
          {
            title: 'Legs and feet',
            prompt: 'Press your feet into the floor and tighten your legs. Hold, then release.',
          },
          {
            title: 'Rest',
            prompt: 'Take one slow breath and notice how your body feels now.',
          },
        ],
      },
      movement: {
        title: 'Gentle movement',
        steps: [
          {
            title: 'Sit or stand tall',
            prompt: 'If it feels okay, stand up or sit tall. Move only in ways that feel comfortable.',
          },
          {
            title: 'Roll your shoulders',
            prompt: 'Roll your shoulders slowly back five times, then forward five times.',
          },
          {
            title: 'Stretch up',
            prompt: 'Reach your arms up and stretch gently, then lower them with a slow breath out.',
          },
          {
            title: 'Turn gently',
            prompt: 'Turn your head slowly to look over one shoulder, then the other.',
          },
          {
            title: 'Shake it out',
            prompt: 'Shake out your hands and arms for a few seconds, then let them rest.',
          },
        ],
      },
      affirmations: {
        title: 'Kind words',
        steps: [
          {
            title: 'This will pass',
            prompt: 'Say it slowly, out loud or in your head: "This is hard, and it will pass."',
          },
          {
            title: 'I am doing my best',
            prompt: '"I am doing the best I can with what I have today."',
          },
          {
            title: 'I can be kind to myself',
            prompt: '"I can speak to myself the way I would speak to a friend."',
          },
          {
            title: 'One step is enough',
            prompt: '"I don\'t have to fix everything. One small step is enough for now."',
          },
          {
            title: 'Your own words',
            prompt: 'Is there a line that helps you? Say it to yourself once more.',
          },
        ],
      },
      support: {
        title: 'Reach for support',
        steps: [
          {
            title: 'Think of someone',
            prompt: 'Who is one person you feel safe with? A friend, someone in your family, a teacher, or someone at work.',
          },
          {
            title: 'How to reach them',
            prompt: 'Would a message, a call, or meeting in person feel easiest right now?',
          },
          {
            title: 'What to say',
            prompt: 'You don\'t need the perfect words. "I\'m having a hard day. Can we talk?" is enough.',
          },
          {
            title: 'If no one comes to mind',
            prompt: 'That is okay. Helplines are there for exactly this. Tap Get help at the top of the screen to see who you can contact.',
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
