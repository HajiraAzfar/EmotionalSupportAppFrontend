import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Compass, Eye, Feather, Footprints, LucideIcon, PersonStanding, Wind} from 'lucide-react-native';

import {illustrations} from '../../assets/brand';
import CalmScreen from '../components/CalmScreen';
import {calm} from '../content';
import {ActivityId} from '../hooks/useGroundYourself';
import {border, colors, radius, space, text, tileShadow, tints} from '../theme';

// Everything Calm can open: an exercise, or the pick-by-need list.
export type Exercise = ActivityId;
type Listed = 'breathing' | 'senses' | 'feet' | 'bodyScan' | 'pmr';
const EXERCISES: {key: Listed; Icon: LucideIcon}[] = [
  {key: 'breathing', Icon: Wind},
  {key: 'senses', Icon: Eye},
  {key: 'feet', Icon: Footprints},
  {key: 'bodyScan', Icon: PersonStanding},
  {key: 'pmr', Icon: Feather},
];

type Props = {
  onOpen: (exercise: Exercise) => void;
  onOpenGroundYourself: () => void;
  onBack: () => void;
};

function Tile({
  title,
  blurb,
  Icon,
  tint,
  featured,
  onPress,
}: {
  title: string;
  blurb: string;
  Icon: LucideIcon;
  tint: string;
  featured?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={blurb}
      style={({pressed}) => [styles.tile, featured && styles.featured, pressed && styles.pressed]}>
      <View style={[styles.iconCircle, {backgroundColor: tint}]}>
        <Icon size={24} color={colors.primary} />
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.tileBlurb} numberOfLines={4}>
        {blurb}
      </Text>
    </Pressable>
  );
}

/** Calm's own list: Ground yourself and the five exercises, as a grid of tiles. */
export default function CalmHomeScreen({onOpen, onOpenGroundYourself, onBack}: Props) {
  const c = calm.home;
  return (
    <CalmScreen title={c.title} backLabel={calm.common.back} onBack={onBack} art={illustrations.headphones}>
      <Text style={styles.intro}>{c.intro}</Text>
      <Text style={styles.safety}>{c.safety}</Text>
      <Text accessibilityRole="header" style={styles.section}>
        {c.exercisesLabel}
      </Text>
      <View style={styles.grid}>
        <Tile
          title={c.groundYourself.title}
          blurb={c.groundYourself.blurb}
          Icon={Compass}
          tint={colors.surface}
          featured
          onPress={onOpenGroundYourself}
        />
        {EXERCISES.map(({key, Icon}, i) => (
          <Tile
            key={key}
            title={c.exercises[key].title}
            blurb={c.exercises[key].blurb}
            Icon={Icon}
            tint={tints[i % tints.length]}
            onPress={() => onOpen(key)}
          />
        ))}
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  intro: {...text.body, marginBottom: space.sm},
  safety: {...text.small, marginBottom: space.md},
  section: {...text.heading, marginTop: space.sm, marginBottom: space.sm},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.sm + 4},
  tile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.card + 4,
    borderWidth: border.width,
    borderColor: colors.line,
    padding: space.md,
    ...tileShadow,
  },
  // Ground yourself, for when she does not know which to pick: on the soft fill.
  featured: {backgroundColor: colors.selected, borderColor: colors.selected},
  pressed: {backgroundColor: colors.selected},
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm + 2,
  },
  tileTitle: {...text.heading, fontSize: 16, marginBottom: space.xs},
  tileBlurb: {...text.small, lineHeight: 18},
});
