import React, {useState} from 'react';
import {Modal, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {colors, space, type} from '../theme';

// FR-ONB-007: shown when the submitted distress baseline is 9 or 10.
// Both a resources control and a continue control are present; continue
// advances onboarding whether or not resources were opened.

type Props = {
  onContinue: () => void;
};

export default function ElevatedDistressScreen({onContinue}: Props) {
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: colors.bg, justifyContent: 'center'}}>
      <View style={{paddingHorizontal: space.screen}}>
        <Text style={type.title}>Thank you for sharing that</Text>
        <Text style={{...type.body, marginTop: 10, marginBottom: 24}}>
          What you're feeling matters, and support is available whenever you
          want it — right now or any time later.
        </Text>

        <PrimaryButton
          label="View crisis resources"
          onPress={() => setResourcesOpen(true)}
        />

        <View style={{height: 12}} />

        <PrimaryButton label="Continue" onPress={onContinue} />
      </View>

      <Modal visible={resourcesOpen} animationType="slide">
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}