import React from 'react';
import {Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft} from 'lucide-react-native';

import ScreenBackground from '../../components/ScreenBackground';
import {colors, icon, space, text, touch} from '../theme';

type Props = {
  title?: string;
  backLabel: string;
  onBack: () => void;
  // An illustration from the brand sheet, beside the title.
  art?: ImageSourcePropType;
  children: React.ReactNode;
};

/**
 * The frame every Calm screen sits in: the page, a Back link and a title.
 * The one place to swap in the app's final background or layout component.
 * The header leaves its right side clear for App.tsx's floating Get help link.
 */
export default function CalmScreen({title, backLabel, onBack, art, children}: Props) {
  return (
    <SafeAreaView style={styles.page}>
      <ScreenBackground />
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={space.sm}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          style={styles.back}>
          <ChevronLeft size={icon.size} color={colors.primary} />
          <Text style={text.link}>{backLabel}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {title ? (
          <View style={styles.titleRow}>
            <Text accessibilityRole="header" style={[styles.title, styles.titleText]}>
              {title}
            </Text>
            {art ? <Image source={art} resizeMode="contain" accessible={false} style={styles.art} /> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: colors.bg},
  header: {paddingHorizontal: space.lg, paddingTop: space.sm},
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.minHeight,
  },
  body: {flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.xl},
  title: {...text.title, marginBottom: space.md},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  titleText: {flex: 1},
  art: {width: 110, height: 96, marginBottom: space.sm},
});
