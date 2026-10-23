import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler} from 'react-native';

import BreathingScreen from './screens/BreathingScreen';
import CalmHomeScreen, {Exercise} from './screens/CalmHomeScreen';
import GroundYourselfScreen from './screens/GroundYourselfScreen';
import GroundingScreen from './screens/GroundingScreen';

export type CalmView = 'home' | 'groundYourself' | Exercise;

type Props = {
  onExit: () => void;
  // Where the module opens; back from an exercise still goes to Calm home.
  initial?: CalmView;
};

/**
 * The Calm module: a home list, a pick-by-need list, and the offline
 * exercises, with its own small navigation so App.tsx only knows one screen.
 * Back (on screen or Android's button) returns to wherever an exercise was
 * opened from, then to Calm home, and only leaves the module from there.
 */
export default function CalmModule({onExit, initial = 'home'}: Props) {
  const [view, setView] = useState<CalmView>(initial);
  // The list an exercise was opened from, so Back returns to it.
  const [origin, setOrigin] = useState<'home' | 'groundYourself'>('home');

  const back = useCallback(() => {
    if (view === 'home') {
      onExit();
    } else if (view === 'groundYourself') {
      setView('home');
    } else {
      setView(origin);
    }
  }, [view, origin, onExit]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => subscription.remove();
  }, [back]);

  const open = (from: 'home' | 'groundYourself') => (exercise: Exercise) => {
    setOrigin(from);
    setView(exercise);
  };

  if (view === 'breathing') {
    return <BreathingScreen onBack={back} />;
  }
  if (view === 'groundYourself') {
    return <GroundYourselfScreen onOpen={open('groundYourself')} onBack={back} />;
  }
  if (view !== 'home') {
    // Keyed, so switching exercise starts at its first step.
    return <GroundingScreen key={view} exercise={view} onBack={back} />;
  }
  return (
    <CalmHomeScreen
      onOpen={open('home')}
      onOpenGroundYourself={() => setView('groundYourself')}
      onBack={onExit}
    />
  );
}
