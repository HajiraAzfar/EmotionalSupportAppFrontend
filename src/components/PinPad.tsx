import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, Text, View} from 'react-native';

import {useReducedMotion} from '../calm/hooks/useReducedMotion';
import {colors, radius, shadow, type} from '../theme';

type Props = {
  value: string;
  length: number;
  disabled?: boolean;
  error?: boolean;
  onChange: (next: string) => void;
  // Called as soon as the last digit is entered — no confirm button.
  onComplete: (value: string) => void;
};
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

// The dots and the number pad, shared by unlocking and by setting a PIN so
// both feel like the same thing.
export default function PinPad({
  value,
  length,
  disabled = false,
  error = false,
  onChange,
  onComplete,
}: Props) {
  // A wrong PIN gives the dots a short shake, the way a lock screen says no
  // without words. Not with the phone's reduce-motion setting on.
  const shake = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!error || reduced) {
      return;
    }
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 7, -7, 3, 0].map(toValue =>
        Animated.timing(shake, {toValue, duration: 50, useNativeDriver: true}),
      ),
    ).start();
  }, [error, reduced, shake]);

  function press(key: string) {
    if (disabled) {
      return;
    }
    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }
    const next = (value + key).slice(0, length);
    onChange(next);
    if (next.length === length) {
      onComplete(next);
    }
  }

  return (
    <View>
      <Animated.View
        accessible
        accessibilityLabel={`${value.length} of ${length} digits entered`}
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 14,
          transform: [{translateX: shake}],
        }}>
        {Array.from({length}, (_, index) => (
          <View
            key={index}
            style={{
              width: 14,
              height: 14,
              borderRadius: radius.pill,
              borderWidth: 1.5,
              borderColor: error ? colors.alert : colors.accent,
              backgroundColor:
                index < value.length ? (error ? colors.alert : colors.accent) : 'transparent',
            }}
          />
        ))}
      </Animated.View>

      <View
        style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24}}>
        {KEYS.map((key, index) => (
          <Pressable
            key={`${key}-${index}`}
            onPress={() => key && press(key)}
            disabled={!key || disabled}
            // A screen reader would read "⌫" as a symbol name, and the gap as nothing.
            accessible={!!key}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Delete' : key}
            style={({pressed}) => ({
              width: '30%',
              alignItems: 'center',
              paddingVertical: 18,
              margin: '1.5%',
              borderRadius: radius.card,
              backgroundColor: !key
                ? 'transparent'
                : pressed
                ? colors.surfaceRaised
                : colors.surface,
              ...(key ? shadow.sm : null),
              opacity: disabled ? 0.4 : 1,
            })}>
            <Text style={type.title}>{key}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}