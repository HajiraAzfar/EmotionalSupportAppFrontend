import React, {useState} from 'react';
import {Image, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {illustrations} from '../assets/brand';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import {space, type} from '../theme';

type Props = {
  // Try the server again; resolves once the app has moved on (or not).
  onRetry: () => Promise<void>;
};

/**
 * Shown when the app could not reach the server at start-up. She is still
 * signed in, so this is a pause with a retry, never the Welcome screen.
 */
export default function OfflineScreen({onRetry}: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.screen}}>
        <Image source={illustrations.arch} resizeMode="contain" accessible={false} style={{width: 260, height: 184}} />
        <Text accessibilityRole="header" style={{...type.title, textAlign: 'center', marginTop: 24}}>
          No connection right now
        </Text>
        <Text style={{...type.body, textAlign: 'center', marginTop: 10, maxWidth: 300}}>
          Your entries are safe. Check your internet, then try again.
        </Text>
        <View style={{width: '100%', marginTop: 28}}>
          <PrimaryButton
            label="Try again"
            busy={busy}
            onPress={async () => {
              setBusy(true);
              await onRetry();
              setBusy(false);
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
