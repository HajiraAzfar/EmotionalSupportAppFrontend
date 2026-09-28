import React, {useCallback, useEffect, useState} from 'react';
import {Image, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import ScreenBackground from '../components/ScreenBackground';

import {isLockSet} from '../storage/appLock';
import {clearTokens} from '../storage/tokens';
import {colors, radius, space, type} from '../theme';

type Props = {
  onOpenAppLock: () => void;
  onSignedOut: () => void;
  onBack: () => void;
};

function Row({
  label,
  description,
  value,
  onPress,
  danger = false,
}: {
  label: string;
  description: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => ({
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.card,
        padding: 16,
        marginBottom: 12,
      })}>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        <Text
          style={{
            ...type.label,
            fontWeight: '600',
            flex: 1,
            color: danger ? colors.alert : colors.ink,
          }}>
          {label}
        </Text>
        {value ? <Text style={{...type.small, color: colors.accent}}>{value}</Text> : null}
      </View>
      <Text style={{...type.small, marginTop: 4}}>{description}</Text>
    </Pressable>
  );
}

// Where the settings that belong to this phone live. The app lock is the main
// one: it is device-only by design (FR-AUTH-009), so it has nowhere else to be.
export default function SettingsScreen({onOpenAppLock, onSignedOut, onBack}: Props) {
  const [locked, setLocked] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    isLockSet().then(setLocked);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function signOut() {
    await clearTokens();
    onSignedOut();
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
        }}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={{...type.small, color: colors.inkSoft}}>Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 30}}>
        <Text style={{...type.title, marginBottom: 20}}>Settings</Text>

        <Text style={{...type.small, marginBottom: 10}}>This phone</Text>
        <Row
          label="App lock"
          description={
            locked
              ? 'Change your PIN, or turn the lock off.'
              : 'Ask for a PIN before the app opens.'
          }
          value={locked === null ? '' : locked ? 'On' : 'Off'}
          onPress={onOpenAppLock}
        />

        <Text style={{...type.small, marginTop: 16, marginBottom: 10}}>Account</Text>
        <Row
          label="Sign out"
          description="Your entries stay safe — they live on the server, not on this phone."
          onPress={signOut}
          danger
        />

        <View style={{alignItems: 'center', marginTop: 34}}>
          <Image
            source={require('../assets/logo.png')}
            style={{width: 92, height: 106, opacity: 0.8}}
            resizeMode="contain"
          />
          <Text style={{...type.small, marginTop: 10}}>mindDoc</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
