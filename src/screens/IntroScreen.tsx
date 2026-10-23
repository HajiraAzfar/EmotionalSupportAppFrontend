import React, {useState} from 'react';
import {Image, ImageSourcePropType, Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {brandImages} from '../assets/brand';
import FadeIn from '../components/FadeIn';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import Illustration from '../components/illustrations/Illustration';
import {IllustrationName} from '../components/illustrations/art';
import {colors, radius, shadow, space, type} from '../theme';

type Props = {
  onDone: () => void;
  onBack: () => void;
};

type Slide = {title: string; body: string; image?: ImageSourcePropType; art?: IllustrationName};

// What the app is for, before an account is asked for: reflection, the CBT
// tools, calm when it is needed, and what stays private. Each claim here is
// something the app actually does.
const SLIDES: Slide[] = [
  {
    title: 'A safe space to reflect',
    body: 'Write or talk through what is on your mind, at your own pace. There is no right way to feel.',
    image: brandImages.journalingWide,
  },
  {
    title: 'Tools for healthier thinking',
    body: 'Guided journals from CBT help you notice thinking traps, weigh the evidence, and find a kinder way to see things.',
    art: 'thoughts',
  },
  {
    title: 'Calm when you need it',
    body: 'Breathing and grounding exercises for heavy moments. They work offline, and nothing in them is saved.',
    art: 'breathing',
  },
  {
    title: 'Yours, and private',
    body: 'Lock the app with a PIN, and leave it in one tap with quick exit. Mind Doc supports you; it is not a replacement for professional care.',
    art: 'selfCompassion',
  },
];

export default function IntroScreen({onDone, onBack}: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground intensity="full" />
      <View style={{flex: 1, paddingHorizontal: space.screen, paddingBottom: 28}}>
        <Pressable
          onPress={() => (index === 0 ? onBack() : setIndex(index - 1))}
          hitSlop={12}
          accessibilityRole="button"
          style={{alignSelf: 'flex-start', paddingVertical: 14}}>
          <Text style={{...type.small, color: colors.inkSoft}}>Back</Text>
        </Pressable>

        <View style={{flex: 1, justifyContent: 'center'}}>
          {/* Keyed, so each slide arrives with its own gentle fade. */}
          <FadeIn key={index} distance={10}>
            <View
              style={{
                borderRadius: radius.image,
                overflow: 'hidden',
                backgroundColor: colors.surface,
                ...shadow.md,
              }}>
              {slide.image ? (
                <Image
                  source={slide.image}
                  resizeMode="cover"
                  accessible={false}
                  style={{width: '100%', height: 230}}
                />
              ) : slide.art ? (
                <Illustration name={slide.art} height={230} />
              ) : null}
            </View>
            <Text accessibilityRole="header" style={{...type.title, marginTop: 28, textAlign: 'center'}}>
              {slide.title}
            </Text>
            <Text style={{...type.body, marginTop: 10, textAlign: 'center'}}>{slide.body}</Text>
          </FadeIn>
        </View>

        <View
          style={{flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20}}
          accessible
          accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((item, i) => (
            <View
              key={item.title}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: radius.pill,
                backgroundColor: i === index ? colors.accent : colors.muted,
              }}
            />
          ))}
        </View>

        <PrimaryButton
          label={last ? 'Create my account' : 'Next'}
          onPress={() => (last ? onDone() : setIndex(index + 1))}
        />
      </View>
    </SafeAreaView>
  );
}
