import React, {useEffect} from 'react';
import {Text, View} from 'react-native';

import FadeIn from '../components/FadeIn';
import Logo from '../components/Logo';
import ScreenBackground from '../components/ScreenBackground';
import Wordmark from '../components/Wordmark';
import {colors, type} from '../theme';

type Props = {
  onDone: () => void;
};

// Long enough for the logo to arrive and be read, short enough that it never
// feels like waiting.
const HOLD_MS = 1500;

// The first thing the app shows, before anything is loaded or unlocked.
export default function SplashScreen({onDone}: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, HOLD_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={{flex: 1}}>
      <ScreenBackground intensity="full" />
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32}}>
        <FadeIn order={0} distance={18}>
          <Logo size={120} badge />
        </FadeIn>
        <FadeIn order={1} style={{marginTop: 18}}>
          <Wordmark size="large" />
        </FadeIn>
        <FadeIn order={2}>
          <Text style={{...type.body, textAlign: 'center', marginTop: 18, color: colors.inkSoft}}>
            A safe space to pause, reflect and reframe your mindset.
          </Text>
        </FadeIn>
      </View>
    </View>
  );
}
