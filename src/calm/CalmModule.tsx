import React, {useEffect, useState} from 'react';
import {BackHandler} from 'react-native';

import BreathingScreen from './screens/BreathingScreen';
import CalmHomeScreen, {Exercise} from './screens/CalmHomeScreen';
import GroundingScreen from './screens/GroundingScreen';

type Props = {
  onExit: () => void;
};

type CalmView = 'home' | Exercise;

/**
 * The Calm module: a home list and three offline exercises, with its own small
 * navigation so App.tsx only knows one screen. Android's back button steps
 * back to the Calm home first, and only leaves the module from there.
 */
export default function CalmModule({onExit}: Props) {
  const [view, setView] = useState<CalmView>('home');

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'home') {
        onExit();
      } else {
        setView('home');
      }
      return true;
    });
    return () => subscription.remove();
  }, [view, onExit]);

  const home = () => setView('home');

  if (view === 'breathing') {
    return <BreathingScreen onBack={home} />;
  }
  if (view === 'senses' || view === 'feet') {
    // Keyed, so switching exercise starts at its first step.
    return <GroundingScreen key={view} exercise={view} onBack={home} />;
  }
  return <CalmHomeScreen onOpen={setView} onBack={onExit} />;
}
