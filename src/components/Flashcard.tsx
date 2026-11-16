import React from 'react';
import {Image, View} from 'react-native';
import Animated, {FadeIn, LinearTransition, SlideInRight, SlideOutLeft} from 'react-native-reanimated';

import {JournalType} from '../api/entries';
import {JOURNALS} from '../screens/JournalScreen';
import {colors, radius, shadow} from '../theme';

type Props = {
  // Changing this is what makes a card leave and the next one arrive. Give it
  // the value being asked for, so every step gets its own card.
  cardKey: string;
  children: React.ReactNode;
  // The first card should settle rather than fly in from nowhere.
  first?: boolean;
  // Whose card it is: its illustrated icon at the top, and a wash of its colour.
  journal?: JournalType;
};

const IN_MS = 300;
const OUT_MS = 180;

/**
 * One card in a journal: the check-in deck, and each step of the Thought,
 * Saving and Exposure journals.
 *
 * The animation is Reanimated's layout animations rather than a hand-driven
 * value: React unmounts the old card when `cardKey` changes and mounts the new
 * one, and the two animations run on the UI thread without a frame of
 * JavaScript in between. Nothing here knows what the card contains.
 */
export default function Flashcard({cardKey, children, first, journal}: Props) {
  const look = journal ? JOURNALS.find(j => j.type === journal) : undefined;
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
          ...(look ? {backgroundImage: `linear-gradient(180deg, ${look.tint} 0%, ${colors.surface} 38%)`} : {}),
          borderWidth: 1,
          borderColor: colors.glassEdge,
          borderRadius: radius.card + 8,
          padding: 24,
          ...shadow.md,
        }}>
        {look ? (
          <Image source={look.art} resizeMode="contain" accessible={false} style={{width: 48, height: 48, marginBottom: 14}} />
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}
