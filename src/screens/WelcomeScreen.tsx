import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FadeIn from '../components/FadeIn';
import Logo from '../components/Logo';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {colors, glass, gradient, radius, shadow, space, type} from '../theme';

type Props = {
  onGoToSignup: () => void;
  onGoToLogin: () => void;
};

export default function WelcomeScreen({onGoToSignup, onGoToLogin}: Props) {
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground intensity="full" />

      <View style={{flex: 1, paddingHorizontal: space.screen, alignItems: 'center'}}>
        <View style={{flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center'}}>
          {/* The mark on a frosted tile, as on the app icon. */}
          <FadeIn order={0} distance={18}>
            <View
              style={{
                ...glass,
                width: 104,
                height: 104,
                borderRadius: radius.image,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Logo size={72} />
            </View>
          </FadeIn>

          <FadeIn order={1}>
            <Text style={{...type.display, textAlign: 'center', marginTop: 22}}>Mind Doc</Text>
          </FadeIn>

          <FadeIn order={2}>
            <Text style={{...type.body, textAlign: 'center', marginTop: 8, maxWidth: 280}}>
              A quiet companion for your loudest thoughts.
            </Text>
          </FadeIn>

          {/* Where the design has its mountain-lake illustration. */}
          <FadeIn order={2} style={{width: '100%'}}>
            <View
              style={{
                height: 180,
                marginTop: 28,
                borderRadius: radius.image,
                backgroundImage: gradient.landscape,
                ...shadow.md,
              }}
            />
          </FadeIn>
        </View>

        <FadeIn order={3} style={{width: '100%', paddingBottom: 36}}>
          <PrimaryButton label="Get started" onPress={onGoToSignup} />

          <Pressable
            onPress={onGoToLogin}
            style={({pressed}) => ({
              marginTop: 12,
              borderRadius: radius.pill,
              paddingVertical: 15,
              alignItems: 'center',
              backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              ...shadow.sm,
            })}>
            <Text style={{...type.label, color: colors.accent}}>I already have an account</Text>
          </Pressable>
        </FadeIn>
      </View>
    </SafeAreaView>
  );
}
