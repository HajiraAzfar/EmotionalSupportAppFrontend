import React from 'react';
import {View} from 'react-native';
import Animated, {FadeIn, LinearTransition, SlideInRight, SlideOutLeft} from 'react-native-reanimated';

import {colors, radius, shadow} from '../theme';

type Props = {
  // Changing this is what makes a card leave and the next one arrive. Give it
  // the value being asked for, so every step gets its own card.
  cardKey: string;
  children: React.ReactNode;
  // The first card should settle rather than fly in from nowhere.
  first?: boolean;
};

const IN_MS = 260;
const OUT_MS = 180;

/**
 * One card in the check-in deck.
 *
 * The animation is Reanimated's layout animations rather than a hand-driven
 * value: React unmounts the old card when `cardKey` changes and mounts the new
 * one, and the two animations run on the UI thread without a frame of
 * JavaScript in between. Nothing here knows what the card contains.
 */
export default function Flashcard({cardKey, children, first}: Props) {
  return (
    <View style={{flex: 1}}>
      <Animated.View
        key={cardKey}
        entering={first ? FadeIn.duration(IN_MS) : SlideInRight.duration(IN_MS)}
        exiting={SlideOutLeft.duration(OUT_MS)}
        // The card grows rather than jumping when the note field opens.
        layout={LinearTransition.duration(IN_MS)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.card,
          padding: 22,
          ...shadow.md,
        }}>
        {children}
      </Animated.View>
    </View>
  );
}
