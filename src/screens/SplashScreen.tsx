import React, {useEffect} from 'react';
import {Text, View} from 'react-native';

import FadeIn from '../components/FadeIn';
import Logo from '../components/Logo';
import ScreenBackground from '../components/ScreenBackground';
import {colors, glass, radius, type} from '../theme';

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
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        {/* The mark on a frosted tile, as on the app icon. */}
        <FadeIn order={0} distance={18}>
          <View
            style={{
              ...glass,
              width: 132,
              height: 132,
              borderRadius: radius.image,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Logo size={92} />
          </View>
        </FadeIn>
        <FadeIn order={1}>
          <Text style={{...type.display, marginTop: 22}}>Mind Doc</Text>
        </FadeIn>
        <FadeIn order={2}>
          <Text style={{...type.small, marginTop: 8, color: colors.inkSoft}}>
            A quiet companion for your loudest thoughts
          </Text>
        </FadeIn>
      </View>
    </View>
  );
}
