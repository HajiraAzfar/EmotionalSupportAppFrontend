import React from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {ZoomIn} from 'react-native-reanimated';
import {Check} from 'lucide-react-native';

import {colors, shadow} from '../theme';

/**
 * The tick that opens an entry's last screen, as in the design: a white card
 * with a sage check that springs in. It is decoration; the title under it says
 * what was saved, so screen readers skip it.
 */
export default function SavedMark() {
  return (
    <Animated.View
      entering={ZoomIn.springify().damping(14)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.card}>
      <View style={styles.circle}>
        <Check size={44} color={colors.accent} strokeWidth={2.6} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: 128,
    height: 128,
    borderRadius: 32,
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.md,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageWash,
  },
});
