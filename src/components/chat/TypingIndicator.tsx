import React, {useEffect, useRef} from 'react';
import {Animated, View} from 'react-native';

import {colors, radius, shadow} from '../../theme';

// "Echo is typing": three dots on Echo's side of the thread while a reply is
// being written, so the wait reads as someone answering, not as a frozen screen.
export default function TypingIndicator() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        180,
        dots.map(dot =>
          Animated.sequence([
            Animated.timing(dot, {toValue: 1, duration: 300, useNativeDriver: true}),
            Animated.timing(dot, {toValue: 0.3, duration: 300, useNativeDriver: true}),
          ]),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [dots]);

  return (
    <View
      accessibilityLabel="Echo is typing"
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        gap: 5,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassEdge,
        ...shadow.sm,
        borderRadius: radius.card,
        borderBottomLeftRadius: radius.tail,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
      }}>
      {dots.map((opacity, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: radius.pill,
            backgroundColor: colors.accent,
            opacity,
          }}
        />
      ))}
    </View>
  );
}
