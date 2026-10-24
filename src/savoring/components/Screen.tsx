import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BackButton from '../../components/BackButton';
import ScreenBackground from '../../components/ScreenBackground';
import CrisisResourcesScreen from '../../screens/CrisisResourcesScreen';
import {colors, space, type} from '../../theme';

type Props = {
  title?: string;
  onBack: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
};

/** A Saving Journal screen: back, Get help (FR-CRIS-009), a title and a scrolling body. */
export default function Screen({title, onBack, right, children}: Props) {
  const [resourcesOpen, setResourcesOpen] = useState(false);
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
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
          <Text accessibilityRole="header" style={{...type.title, marginBottom: 6}}>
            {title}
          </Text>
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
