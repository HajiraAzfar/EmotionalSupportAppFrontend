import React from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {brandImages} from '../assets/brand';
import FadeIn from '../components/FadeIn';
import Logo from '../components/Logo';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import Wordmark from '../components/Wordmark';
import {colors, radius, shadow, space, type} from '../theme';

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
          <FadeIn order={0} distance={18}>
            <Logo size={92} badge />
          </FadeIn>

          <FadeIn order={1} style={{marginTop: 14}}>
            <Wordmark />
          </FadeIn>

          <FadeIn order={2}>
            <Text style={{...type.body, textAlign: 'center', marginTop: 12, maxWidth: 290}}>
              Your safe space for a calmer mind and a stronger you.
            </Text>
          </FadeIn>

          {/* Dawn over lavender hills, from the brand artwork. */}
          <FadeIn order={2} style={{width: '100%'}}>
            <Image
              source={brandImages.landscape}
              resizeMode="cover"
              accessible={false}
              style={{
                width: '100%',
                height: 200,
                marginTop: 28,
                borderRadius: radius.image,
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
