import React from 'react';
import {Pressable, Text} from 'react-native';
import {Check, X} from 'lucide-react-native';

import {colors, font, radius, type} from '../../theme';

type Props = {
  label: string;
  on: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  // The "Selected" row: tapping removes it, so it shows a cross instead of a tick.
  removable?: boolean;
};

// One selectable chip. Both states set the same style properties and only change
// their values: swapping a border for a CSS backgroundImage on a live view
// closed the app on tap (Android, New Architecture), so chips stay solid.
//
// No haptic here. Vibration.vibrate throws asynchronously on the New
// Architecture, so a try/catch around it catches nothing: on a build without
// the VIBRATE permission every tap raised "Neither user nor current process
// has android.permission.VIBRATE" and the chips became unusable. A 10ms buzz
// is not worth a second outage.
export default function Chip({label, on, onPress, onLongPress, removable}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="checkbox"
      accessibilityState={{checked: on}}
      accessibilityLabel={label}
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: on ? colors.accent : colors.line,
        backgroundColor: on ? colors.accent : colors.surface,
        marginRight: 8,
        marginBottom: 8,
      }}>
      {on ? (
        removable ? <X size={14} color={colors.onAccent} /> : <Check size={14} color={colors.onAccent} />
      ) : null}
      <Text
        style={{
          ...type.small,
          fontFamily: on ? font.semibold : font.medium,
          color: on ? colors.onAccent : colors.ink,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}
