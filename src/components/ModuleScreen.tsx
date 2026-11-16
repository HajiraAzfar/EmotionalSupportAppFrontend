import React, {useState} from 'react';
import {Image, ImageSourcePropType, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BackButton from './BackButton';
import ScreenBackground from './ScreenBackground';
import CrisisResourcesScreen from '../screens/CrisisResourcesScreen';
import {colors, space, type} from '../theme';

type Props = {
  title?: string;
  onBack: () => void;
  right?: React.ReactNode;
  // An illustration from the brand sheet, beside the title.
  art?: ImageSourcePropType;
  children: React.ReactNode;
};

/** A journal module's screen: back, Get help (FR-CRIS-009), a title and a scrolling body. */
export default function Screen({title, onBack, right, art, children}: Props) {
  const [resourcesOpen, setResourcesOpen] = useState(false);
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground leaves />
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: space.screen, paddingVertical: 12}}>
        <BackButton onPress={onBack} />
        <View style={{flex: 1}} />
        {right}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}} keyboardShouldPersistTaps="handled">
        {title ? (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6}}>
            <Text accessibilityRole="header" style={{...type.title, flex: 1}}>
              {title}
            </Text>
            {art ? <Image source={art} resizeMode="contain" accessible={false} style={{width: 92, height: 84}} /> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

export function Card({children, tint}: {children: React.ReactNode; tint?: string}) {
  return (
    <View
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: tint ?? colors.surface,
      }}>
      {children}
    </View>
  );
}

export function LinkRow({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
      <Text style={type.link}>{label}</Text>
    </Pressable>
  );
}
