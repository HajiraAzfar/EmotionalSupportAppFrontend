import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BackButton from '../components/BackButton';
import ScreenBackground from '../components/ScreenBackground';
import Chip from '../components/chat/Chip';
import {deleteAccount} from '../api/auth';
import {clearLock} from '../storage/appLock';
import {clearReminder} from '../storage/reminders';
import {clearTokens} from '../storage/tokens';
import {colors, radius, shadow, space, type} from '../theme';

type Props = {
  onBack: () => void;
  onDeleted: () => void;
};

/**
 * SRS 4.12: deleting the account and everything in it. Three things stand
 * between a tap and the deletion: confirming it is understood, the password,
 * and a last "Delete everything?" — because nothing can bring it back.
 */
export default function DeleteAccountScreen({onBack, onDeleted}: Props) {
  const [understood, setUnderstood] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = understood && password.length > 0 && !busy;

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await deleteAccount(password);
      // Nothing of the account stays on this phone either.
      await clearLock();
      await clearReminder().catch(() => undefined);
      await clearTokens();
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function confirm() {
    Alert.alert(
      'Delete everything?',
      'Your account and all of your entries will be deleted. This cannot be undone.',
      [
        {text: 'Keep my account', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: remove},
      ],
    );
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View style={{paddingHorizontal: space.screen, paddingVertical: 12}}>
        <BackButton onPress={onBack} />
      </View>
      <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}
          keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={type.title}>
            Delete your account
          </Text>
          <Text style={{...type.body, marginTop: 10}}>
            This permanently deletes your account and everything in it: every journal entry and
            chat, your insights and weekly reflections, your saved articles and badges.
          </Text>
          <Text style={{...type.body, marginTop: 10}}>
            It cannot be undone, and no one can recover it afterwards. The app lock on this phone is
            removed too.
          </Text>

          <View style={{marginTop: 22}}>
            <Chip
              label="I understand this cannot be undone"
              on={understood}
              onPress={() => setUnderstood(value => !value)}
            />
          </View>

          <Text style={{...type.small, marginTop: 14, marginBottom: 7}}>Your password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            accessibilityLabel="Your password"
            placeholder="Password"
            placeholderTextColor={colors.inkFaint}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.input,
              paddingHorizontal: 16,
              paddingVertical: 15,
              ...type.input,
              color: colors.ink,
              ...shadow.sm,
            }}
          />

          {error ? (
            <Text style={{...type.small, color: colors.alert, marginTop: 12}}>{error}</Text>
          ) : null}

          <Pressable
            onPress={confirm}
            disabled={!ready}
            accessibilityRole="button"
            accessibilityState={{disabled: !ready}}
            style={({pressed}) => ({
              marginTop: 28,
              minHeight: 52,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.alert,
              opacity: !ready ? 0.45 : pressed ? 0.85 : 1,
            })}>
            {busy ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={{...type.label, color: colors.onAccent}}>Delete my account</Text>
            )}
          </Pressable>

          <Pressable onPress={onBack} style={{paddingVertical: 16}}>
            <Text style={{...type.link, textAlign: 'center'}}>Keep my account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
