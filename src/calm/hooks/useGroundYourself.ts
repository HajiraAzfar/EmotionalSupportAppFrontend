import {useMemo, useState} from 'react';

export type Need = 'anxious' | 'overwhelmed' | 'low' | 'disconnected';
export type NeedChoice = 'any' | Need;
// 0 means any length.
export type TimeChoice = 0 | 1 | 3 | 5;

// The step-by-step exercises, all run by useGroundingFlow.
export type StepExercise =
  | 'senses'
  | 'feet'
  | 'bodyScan'
  | 'pmr'
  | 'movement'
  | 'affirmations'
  | 'support';
export type ActivityId = 'breathing' | StepExercise;

export type Activity = {
  id: ActivityId;
  // Roughly how long it takes, in minutes.
  minutes: number;
  needs: Need[];
};

export const NEED_CHOICES: NeedChoice[] = ['any', 'anxious', 'overwhelmed', 'low', 'disconnected'];
export const TIME_CHOICES: TimeChoice[] = [0, 1, 3, 5];

// Shortest first, so a heavy moment meets the quickest help at the top.
export const ACTIVITIES: Activity[] = [
  {id: 'breathing', minutes: 1, needs: ['anxious', 'overwhelmed']},
  {id: 'feet', minutes: 1, needs: ['anxious', 'overwhelmed', 'disconnected']},
  {id: 'affirmations', minutes: 1, needs: ['low', 'anxious']},
  {id: 'senses', minutes: 3, needs: ['anxious', 'overwhelmed', 'disconnected']},
  {id: 'movement', minutes: 3, needs: ['low', 'overwhelmed', 'disconnected']},
  {id: 'support', minutes: 3, needs: ['low', 'overwhelmed', 'disconnected']},
  {id: 'bodyScan', minutes: 5, needs: ['anxious', 'disconnected']},
  {id: 'pmr', minutes: 5, needs: ['anxious', 'overwhelmed']},
];

/** The activities that fit a feeling and fit inside the time given. Pure. */
export function matchActivities(activities: Activity[], need: NeedChoice, time: TimeChoice) {
  return activities.filter(
    a => (need === 'any' || a.needs.includes(need)) && (time === 0 || a.minutes <= time),
  );
}

/** Choosing a feeling and a time, and the activities that match both. */
export function useGroundYourself() {
  const [need, setNeed] = useState<NeedChoice>('any');
  const [time, setTime] = useState<TimeChoice>(0);
  const activities = useMemo(() => matchActivities(ACTIVITIES, need, time), [need, time]);
  return {need, setNeed, time, setTime, activities};
}
