import React from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FadeIn from '../components/FadeIn';
import ScreenBackground from '../components/ScreenBackground';
import {colors, radius, space, type} from '../theme';

type Props = {
  onGoToSignup: () => void;
  onGoToLogin: () => void;
};

export default function WelcomeScreen({onGoToSignup, onGoToLogin}: Props) {
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground intensity="full" />

      <View style={{flex: 1, paddingHorizontal: space.screen, alignItems: 'center'}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          {/* The logo sits in a pane of glass, so it belongs to the screen
              rather than floating on it. */}
          <FadeIn order={0} distance={18}>
            <View
              style={{
                width: 250,
                height: 250,
                borderRadius: 125,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.16)',
              }}>
              <Image
                source={require('../assets/logo.png')}
                style={{width: 176, height: 204}}
                resizeMode="contain"
              />
            </View>
          </FadeIn>

          <FadeIn order={1}>
            <Text style={{...type.display, fontSize: 46, textAlign: 'center', marginTop: 30}}>
              mindDoc
            </Text>
          </FadeIn>

          <FadeIn order={2}>
            <Text
              style={{
                ...type.body,
                textAlign: 'center',
                marginTop: 10,
                maxWidth: 280,
                lineHeight: 24,
              }}>
              A quiet companion for your loudest thoughts.
            </Text>
          </FadeIn>
        </View>

        <FadeIn order={3} style={{width: '100%', paddingBottom: 36}}>
          <Pressable
            onPress={onGoToSignup}
            style={({pressed}) => ({
              backgroundColor: pressed ? colors.coralSoft : colors.accent,
              borderRadius: radius.pill,
              paddingVertical: 17,
              alignItems: 'center',
              // A soft halo, so the button glows out of the glass rather than
              // sitting flat on it.
              shadowColor: colors.accent,
              shadowOpacity: 0.5,
              shadowRadius: 18,
              shadowOffset: {width: 0, height: 6},
              elevation: 6,
            })}>
            <Text style={{...type.label, color: colors.onAccent, fontSize: 16, fontWeight: '600'}}>
              Get started
            </Text>
          </Pressable>

          <Pressable
            onPress={onGoToLogin}
            style={({pressed}) => ({
              marginTop: 12,
              borderRadius: radius.pill,
              paddingVertical: 15,
              alignItems: 'center',
              backgroundColor: pressed
                ? 'rgba(255, 255, 255, 0.10)'
                : 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.16)',
            })}>
            <Text style={{...type.label, color: colors.ink}}>I already have an account</Text>
          </Pressable>
        </FadeIn>
      </View>
    </SafeAreaView>
  );
}
