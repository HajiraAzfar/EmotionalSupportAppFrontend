import React, {useState} from 'react';
import {Modal, Pressable, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import CrisisResourcesScreen from '../screens/CrisisResourcesScreen';
import {colors, space, type} from '../theme';

// FR-CRIS-009: crisis resources one tap away on every screen. Screens with their
// own header link (Home, Journal, Insights, Entries, journals) don't use this;
// App.tsx floats it over every other screen, signed in or not.
export default function GetHelp() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={12}
        accessibilityRole="button"
        style={{position: 'absolute', top: insets.top + 14, right: space.screen, zIndex: 10}}>
        <Text style={{...type.link, color: colors.alert}}>Get help</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <CrisisResourcesScreen onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
