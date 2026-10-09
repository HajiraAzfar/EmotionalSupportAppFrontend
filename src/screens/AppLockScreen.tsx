import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Logo from '../components/Logo';
import PinPad from '../components/PinPad';
import ScreenBackground from '../components/ScreenBackground';

import {
  Attempts,
  PIN_LENGTH,
  getAttempts,
  registerFailure,
  resetAttempts,
  verifyPin,
} from '../storage/appLock';
import {colors, space, type} from '../theme';

type Props = {
  onUnlocked: () => void;
  // Forgetting the PIN signs her out: it exists only on this device, so there
  // is nothing to recover and nothing to email her.
  onForgot: () => void;
};

function waitText(msFrom: number): string {
  const seconds = Math.ceil(msFrom / 1000);
  if (seconds <= 60) {
    return `Try again in ${seconds} seconds.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
}

// FR-AUTH-009: the whole app sits behind this until the PIN is right. The PIN
// is checked on the device against a stored hash — nothing is sent anywhere.
export default function AppLockScreen({onUnlocked, onForgot}: Props) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState<Attempts>({failed: 0, lockedUntil: 0});
  const [checking, setChecking] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getAttempts().then(setAttempts);
  }, []);

  // While a lockout is running, tick so the countdown stays honest.
  useEffect(() => {
    if (attempts.lockedUntil <= now) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [attempts.lockedUntil, now]);

  const lockedFor = Math.max(0, attempts.lockedUntil - now);

  const submit = useCallback(
    async (candidate: string) => {
      setChecking(true);
      if (await verifyPin(candidate)) {
        await resetAttempts();
        onUnlocked();
        return;
      }
      const next = await registerFailure();
      setAttempts(next);
      setNow(Date.now());
      setWrong(true);
      setPin('');
      setChecking(false);
    },
    [onUnlocked],
  );

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View style={{flex: 1, paddingHorizontal: space.screen, justifyContent: 'center'}}>
        <View style={{alignItems: 'center', marginBottom: 12}}>
          <Logo size={56} />
        </View>
        <Text style={{...type.title, textAlign: 'center'}}>Mind Doc</Text>
        <Text style={{...type.body, textAlign: 'center', marginTop: 8, marginBottom: 30}}>
          Enter your PIN to continue.
        </Text>

        <PinPad
          value={pin}
          length={PIN_LENGTH}
          disabled={checking || lockedFor > 0}
          error={wrong}
          onChange={next => {
            setWrong(false);
            setPin(next);
          }}
          onComplete={submit}
        />

        <Text
          style={{
            ...type.small,
            textAlign: 'center',
            marginTop: 18,
            color: lockedFor > 0 || wrong ? colors.alert : 'transparent',
          }}>
          {lockedFor > 0 ? waitText(lockedFor) : wrong ? 'That PIN is not right.' : '—'}
        </Text>

        <Pressable onPress={onForgot} style={{paddingVertical: 18}}>
          <Text style={{...type.link, textAlign: 'center'}}>
            Forgot your PIN? Sign in again
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}