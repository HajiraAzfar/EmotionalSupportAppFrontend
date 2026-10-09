import React, {useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BackButton from '../components/BackButton';
import PinPad from '../components/PinPad';
import ScreenBackground from '../components/ScreenBackground';
import {PIN_LENGTH, clearLock, isLockSet, setPin, verifyPin} from '../storage/appLock';
import {colors, glass, radius, space, type} from '../theme';

type Props = {
  onDone: () => void;
};

// menu → what she can do when a lock already exists.
// current → prove the old PIN before changing or removing it.
// new / confirm → the new PIN, twice.
type Phase = 'menu' | 'current' | 'new' | 'confirm';
type Intent = 'set' | 'change' | 'remove';

const TITLES: Record<Phase, string> = {
  menu: 'App lock',
  current: 'Enter your current PIN',
  new: 'Choose a PIN',
  confirm: 'Enter it once more',
};

// FR-AUTH-009: setting, changing and removing the lock all happen on the
// device. Nothing about the PIN is sent to the server at any point.
export default function SetAppLockScreen({onDone}: Props) {
  const [locked, setLocked] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('new');
  const [intent, setIntent] = useState<Intent>('set');
  const [entry, setEntry] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    isLockSet().then(exists => {
      setLocked(exists);
      setPhase(exists ? 'menu' : 'new');
      setIntent(exists ? 'change' : 'set');
    });
  }, []);

  function restart(next: Phase, nextIntent?: Intent) {
    setEntry('');
    setFirstPin('');
    setMessage('');
    if (nextIntent) {
      setIntent(nextIntent);
    }
    setPhase(next);
  }

  async function complete(value: string) {
    if (phase === 'current') {
      if (!(await verifyPin(value))) {
        setEntry('');
        setMessage('That PIN is not right.');
        return;
      }
      if (intent === 'remove') {
        await clearLock();
        onDone();
        return;
      }
      restart('new');
      return;
    }

    if (phase === 'new') {
      setFirstPin(value);
      setEntry('');
      setMessage('');
      setPhase('confirm');
      return;
    }

    // confirm
    if (value !== firstPin) {
      setEntry('');
      setFirstPin('');
      setMessage('Those did not match. Let us try again.');
      setPhase('new');
      return;
    }
    await setPin(value);
    onDone();
  }

  if (locked === null) {
    return (
      <SafeAreaView style={{flex: 1}}>
        <ScreenBackground />
      </SafeAreaView>
    );
  }

  const option = (label: string, description: string, onPress: () => void, danger = false) => (
    <Pressable
      onPress={onPress}
      style={({pressed}) => ({
        ...glass,
        backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
        borderRadius: radius.card,
        padding: 16,
        marginBottom: 12,
      })}>
      <Text style={{...type.label, color: danger ? colors.alert : colors.ink}}>
        {label}
      </Text>
      <Text style={{...type.small, marginTop: 4}}>{description}</Text>
    </Pressable>
  );

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
        <BackButton onPress={onDone} />
      </View>

      <View style={{flex: 1, paddingHorizontal: space.screen}}>
        <Text style={{...type.title, marginBottom: 8}}>{TITLES[phase]}</Text>

        {phase === 'menu' ? (
          <View style={{marginTop: 12}}>
            <Text style={{...type.body, marginBottom: 20}}>
              Your PIN is kept on this phone only. It is never sent anywhere, and it cannot be
              recovered — if you forget it you will sign in again.
            </Text>
            {option('Change PIN', 'Enter the current one, then choose a new one.', () =>
              restart('current', 'change'),
            )}
            {option(
              'Turn off app lock',
              'The app will open without a PIN.',
              () => restart('current', 'remove'),
              true,
            )}
          </View>
        ) : (
          <>
            <Text style={{...type.body, marginBottom: 26}}>
              {phase === 'new'
                ? `${PIN_LENGTH} digits. Pick something you will remember — it cannot be recovered.`
                : phase === 'confirm'
                ? 'So we know it was not a slip.'
                : 'This proves the phone is yours.'}
            </Text>

            <PinPad
              value={entry}
              length={PIN_LENGTH}
              error={Boolean(message)}
              onChange={next => {
                setMessage('');
                setEntry(next);
              }}
              onComplete={complete}
            />

            <Text
              style={{
                ...type.small,
                textAlign: 'center',
                marginTop: 18,
                color: message ? colors.alert : 'transparent',
              }}>
              {message || '—'}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}